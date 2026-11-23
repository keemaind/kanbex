using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardCardTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public BoardCardTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CardFields_SaveAndRoundTrip()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);
        var user = (await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;
        var dueDate = new DateTime(2027, 1, 15, 0, 0, 0, DateTimeKind.Utc);

        var target = board.Columns[0];
        var movedTaskId = target.Tasks[0].Id;
        var request = BuildUpdate(board, board.Columns.Select(column => column.Id == target.Id
            ? new UpdateBoardColumnRequest(
                column.Id,
                column.Title,
                column.WipLimit,
                column.Order,
                column.Tasks.Select((task, index) => index == 0
                    ? new UpdateBoardTaskRequest(
                        task.Id, task.Title, task.Description, task.Priority, task.Order,
                        user.Id, dueDate, 42)
                    : ToTaskRequest(task)).ToList())
            : ToColumnRequest(column)).ToList());

        var response = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", request, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var saved = (await response.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        var savedTask = saved.Columns[0].Tasks.Single(task => task.Id == movedTaskId);
        Assert.Equal(user.Id, savedTask.AssigneeId);
        Assert.Equal(user.DisplayName, savedTask.AssigneeName);
        Assert.Equal(dueDate, savedTask.DueDate);
        Assert.Equal(42, savedTask.Estimate);

        var reloaded = (await client.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        var reloadedTask = reloaded.Columns[0].Tasks.Single(task => task.Id == movedTaskId);
        Assert.Equal(user.Id, reloadedTask.AssigneeId);
        Assert.Equal(42, reloadedTask.Estimate);
    }

    [Fact]
    public async Task Assignee_MustBeBoardParticipant()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);

        using var stranger = CreateClient();
        await RegisterAsync(stranger, "outsider");
        var strangerUser = (await stranger.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;

        var request = BuildUpdate(board, board.Columns
            .Select(column => ToColumnRequest(column))
            .ToList());
        request = request with
        {
            Columns = request.Columns.Select((column, index) => index == 0
                ? column with
                {
                    Tasks = column.Tasks.Select((task, taskIndex) => taskIndex == 0
                        ? task with { AssigneeId = strangerUser.Id }
                        : task).ToList(),
                }
                : column).ToList(),
        };

        var response = await SendJsonAsync(creator, HttpMethod.Put, $"/api/boards/{board.Id}", request, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task History_RecordsCreatedMovedAssignedAndUpdated()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);
        var user = (await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;

        var source = board.Columns[0];
        var target = board.Columns[2];
        var movedTask = source.Tasks[0];
        var newTaskId = Guid.NewGuid();

        // 1. Создаём карточку в первой колонке и назначаем исполнителя.
        var createRequest = BuildUpdate(board, board.Columns.Select(column => column.Id == source.Id
            ? new UpdateBoardColumnRequest(
                column.Id, column.Title, column.WipLimit, column.Order,
                column.Tasks.Select(ToTaskRequest)
                    .Append(new UpdateBoardTaskRequest(newTaskId, "Новая карточка", "", TaskPriority.High, column.Tasks.Count, user.Id))
                    .ToList())
            : ToColumnRequest(column)).ToList());
        var created = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", createRequest, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var createdBoard = (await created.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;

        var history = await client.GetFromJsonAsync<List<TaskHistoryResponse>>(
            $"/api/boards/{board.Id}/tasks/{newTaskId}/history", JsonOptions);
        Assert.NotNull(history);
        Assert.Contains(history!, entry => entry.EventType == TaskHistoryEventType.Created);
        Assert.Contains(history!, entry => entry.EventType == TaskHistoryEventType.Assigned);

        // 2. Перемещаем карточку и меняем оценку.
        var moveRequest = BuildUpdate(createdBoard, createdBoard.Columns.Select(column =>
            column.Id == source.Id
                ? new UpdateBoardColumnRequest(
                    column.Id, column.Title, column.WipLimit, column.Order,
                    column.Tasks.Where(task => task.Id != newTaskId)
                        .Select((task, index) => ToTaskRequest(task) with { Order = index }).ToList())
                : column.Id == target.Id
                    ? new UpdateBoardColumnRequest(
                        column.Id, column.Title, column.WipLimit, column.Order,
                        column.Tasks.Select(ToTaskRequest)
                            .Append(new UpdateBoardTaskRequest(newTaskId, "Новая карточка", "", TaskPriority.High,
                                column.Tasks.Count, user.Id, null, 8))
                            .ToList())
                    : ToColumnRequest(column)).ToList());
        var moved = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", moveRequest, await GetTokenAsync(client));
        Assert.True(moved.StatusCode == HttpStatusCode.OK,
            $"Expected OK, got {(int)moved.StatusCode}: {await moved.Content.ReadAsStringAsync()}");

        history = await client.GetFromJsonAsync<List<TaskHistoryResponse>>(
            $"/api/boards/{board.Id}/tasks/{newTaskId}/history", JsonOptions);
        var movedEntry = Assert.Single(history!, entry => entry.EventType == TaskHistoryEventType.Moved);
        Assert.Equal(source.Id, movedEntry.OldColumnId);
        Assert.Equal(target.Id, movedEntry.NewColumnId);
        Assert.Contains(history!, entry => entry.EventType == TaskHistoryEventType.Updated);

        // Перемещение не дублируется при повторном сохранении без изменений.
        var current = (await client.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        var noop = BuildUpdate(current, current.Columns.Select(ToColumnRequest).ToList());
        var repeated = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", noop, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, repeated.StatusCode);
        history = await client.GetFromJsonAsync<List<TaskHistoryResponse>>(
            $"/api/boards/{board.Id}/tasks/{newTaskId}/history", JsonOptions);
        Assert.Single(history!, entry => entry.EventType == TaskHistoryEventType.Moved);
    }

    [Fact]
    public async Task History_HiddenFromNonMembers()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);
        var taskId = board.Columns[0].Tasks[0].Id;

        using var stranger = CreateClient();
        await RegisterAsync(stranger, "history");

        var response = await stranger.GetAsync($"/api/boards/{board.Id}/tasks/{taskId}/history");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static UpdateBoardRequest BuildUpdate(BoardResponse board, IReadOnlyList<UpdateBoardColumnRequest> columns) =>
        new(board.Title, board.Description, board.Version, columns);

    private static UpdateBoardColumnRequest ToColumnRequest(BoardColumnResponse column) =>
        new(column.Id, column.Title, column.WipLimit, column.Order,
            column.Tasks.Select(ToTaskRequest).ToList());

    private static UpdateBoardTaskRequest ToTaskRequest(BoardTaskResponse task) =>
        new(task.Id, task.Title, task.Description, task.Priority, task.Order,
            task.AssigneeId, task.DueDate, task.Estimate);

    private async Task<BoardResponse> CreateBoardAsync(HttpClient client)
    {
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/boards",
            new { title = $"Board {Guid.NewGuid():N}", description = "" }, await GetTokenAsync(client));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    });

    private static async Task LoginAsync(HttpClient client, string email, string password)
    {
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/auth/login",
            new { email, password }, await GetTokenAsync(client));
        response.EnsureSuccessStatusCode();
        _ = await GetTokenAsync(client);
    }

    private static async Task RegisterAsync(HttpClient client, string prefix)
    {
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/auth/register",
            new { displayName = $"User {prefix}", email = $"{prefix}-{Guid.NewGuid():N}@kanbex.local", password = DemoPassword },
            await GetTokenAsync(client));
        response.EnsureSuccessStatusCode();
        _ = await GetTokenAsync(client);
    }

    private static async Task<string> GetTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/auth/antiforgery-token");
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("requestToken").GetString()!;
    }

    private static async Task<HttpResponseMessage> SendJsonAsync(
        HttpClient client, HttpMethod method, string url, object? body, string? token)
    {
        using var request = new HttpRequestMessage(method, url);
        if (body is not null) request.Content = JsonContent.Create(body);
        if (token is not null) request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request);
    }
}
