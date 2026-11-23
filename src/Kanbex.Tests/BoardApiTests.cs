using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardApiTests : IClassFixture<KanbexApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public BoardApiTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Create_List_Details_Update_AndDelete_WorkForOwner()
    {
        using var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        await LoginAsync(client, "student@kanbex.local", "Student1");

        var createResponse = await SendJsonAsync(client, HttpMethod.Post, "/api/boards",
            new { title = $"Board {Guid.NewGuid():N}", description = "Description" }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(createResponse.Headers.Location);
        var created = await createResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal(0, created.Version);
        Assert.Equal(3, created.Columns.Count);
        Assert.Equal(3, created.Columns[0].Tasks.Count);
        Assert.Equal(2, created.Columns[1].Tasks.Count);
        Assert.Single(created.Columns[2].Tasks);
        Assert.Equal(2, created.Columns[1].WipLimit);

        var listResponse = await client.GetAsync("/api/boards");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listJson = await listResponse.Content.ReadFromJsonAsync<List<BoardSummaryResponse>>(JsonOptions);
        Assert.Contains(listJson!, board =>
            board.Id == created.Id &&
            board.ColumnCount == 3 &&
            board.TaskCount == 6 &&
            board.CompletedTaskCount == 1 &&
            board.UpdatedAt != default);

        var detailsResponse = await client.GetAsync($"/api/boards/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, detailsResponse.StatusCode);
        Assert.Equal(created.Id, (await detailsResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))?.Id);

        var updatedTitle = "Обновлённая доска";
        var newTaskId = Guid.NewGuid();
        var updateRequest = AsUpdateRequest(created, updatedTitle);
        updateRequest = updateRequest with
        {
            Columns = updateRequest.Columns.Select((column, index) => index == 0
                ? column with
                {
                    Tasks = column.Tasks
                        .Append(new UpdateBoardTaskRequest(newTaskId, "First task", "", TaskPriority.Critical, column.Tasks.Count))
                        .ToList(),
                }
                : column).ToList(),
        };
        var updateResponse = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{created.Id}", updateRequest, await GetTokenAsync(client));
        Assert.True(updateResponse.StatusCode == HttpStatusCode.OK,
            $"Expected OK, got {(int)updateResponse.StatusCode}: {await updateResponse.Content.ReadAsStringAsync()}");
        var updated = await updateResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal(updatedTitle, updated.Title);
        Assert.Equal(1, updated.Version);
        Assert.Equal(TaskPriority.Critical, updated.Columns[0].Tasks.Single(task => task.Id == newTaskId).Priority);

        var deleteResponse = await SendJsonAsync(client, HttpMethod.Delete, $"/api/boards/{created.Id}", body: null, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/boards/{created.Id}")).StatusCode);
    }

    [Fact]
    public async Task BoardEndpoints_HideBoardsOwnedByAnotherUser()
    {
        using var ownerClient = CreateClient();
        await LoginAsync(ownerClient, "student@kanbex.local", "Student1");
        var createResponse = await SendJsonAsync(ownerClient, HttpMethod.Post, "/api/boards",
            new { title = $"Private {Guid.NewGuid():N}", description = "" }, await GetTokenAsync(ownerClient));
        var board = (await createResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;

        using var otherClient = CreateClient();
        await RegisterAsync(otherClient, $"other-{Guid.NewGuid():N}@kanbex.local");
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.GetAsync($"/api/boards/{board.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SendJsonAsync(otherClient, HttpMethod.Delete,
            $"/api/boards/{board.Id}", null, await GetTokenAsync(otherClient))).StatusCode);
    }

    [Fact]
    public async Task Update_RejectsWipOverflowAndStaleVersion()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");
        var createResponse = await SendJsonAsync(client, HttpMethod.Post, "/api/boards",
            new { title = $"Version {Guid.NewGuid():N}", description = "" }, await GetTokenAsync(client));
        var board = (await createResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;

        var overflowColumns = board.Columns.Select((column, index) => index == 1
            ? column with
            {
                Tasks =
                [
                    new BoardTaskResponse(Guid.NewGuid(), "Task A", "", Kanbex.Infrastructure.Domain.Enums.TaskPriority.Medium, 0),
                    new BoardTaskResponse(Guid.NewGuid(), "Task B", "", Kanbex.Infrastructure.Domain.Enums.TaskPriority.High, 1),
                    new BoardTaskResponse(Guid.NewGuid(), "Task C", "", Kanbex.Infrastructure.Domain.Enums.TaskPriority.Critical, 2),
                ],
            }
            : column).Select(column => new UpdateBoardColumnRequest(column.Id, column.Title, column.WipLimit, column.Order,
                column.Tasks.Select(task => new UpdateBoardTaskRequest(task.Id, task.Title, task.Description, task.Priority, task.Order)).ToList())).ToList();
        var overflowResponse = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}",
            new UpdateBoardRequest(board.Title, board.Description, board.Version, overflowColumns), await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.Conflict, overflowResponse.StatusCode);

        var validUpdate = AsUpdateRequest(board, "First save");
        var firstSave = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", validUpdate, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, firstSave.StatusCode);
        var staleSave = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", validUpdate, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.Conflict, staleSave.StatusCode);
    }

    [Fact]
    public async Task MutatingBoardEndpoint_WithoutAntiforgeryToken_ReturnsBadRequest()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");

        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/boards",
            new { title = "No token board", description = "" }, token: null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_MovesCardBetweenColumns_AndKeepsComments()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");
        var board = await CreateBoardAsync(client);
        Assert.Equal(2, board.Columns[1].Tasks.Count);

        var movedTask = board.Columns[1].Tasks[0];
        var sourceColumn = board.Columns[1];
        var targetColumn = board.Columns[2];

        var user = (await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;
        await AddCommentAsync(movedTask.Id, user.Id);

        var remainingSourceTasks = sourceColumn.Tasks
            .Skip(1)
            .Select(task => new UpdateBoardTaskRequest(task.Id, task.Title, task.Description, task.Priority, task.Order - 1))
            .ToList();
        var targetTasks = targetColumn.Tasks
            .Select(task => new UpdateBoardTaskRequest(task.Id, task.Title, task.Description, task.Priority, task.Order))
            .Append(new UpdateBoardTaskRequest(movedTask.Id, movedTask.Title, movedTask.Description, movedTask.Priority, targetColumn.Tasks.Count))
            .ToList();

        var moveRequest = AsUpdateRequest(board, board.Title) with
        {
            Columns = board.Columns.Select(column => column.Id == sourceColumn.Id
                ? ToUpdateColumn(column, column.Order, remainingSourceTasks)
                : column.Id == targetColumn.Id
                    ? ToUpdateColumn(column, column.Order, targetTasks)
                    : ToUpdateColumn(column, column.Order)).ToList(),
        };

        var moveResponse = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", moveRequest, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, moveResponse.StatusCode);
        var moved = (await moveResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Equal(sourceColumn.Tasks[1].Id, Assert.Single(moved.Columns[1].Tasks).Id);
        Assert.Contains(moved.Columns[2].Tasks, task => task.Id == movedTask.Id);
        Assert.Equal(board.Version + 1, moved.Version);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KanbexDbContext>();
        var comment = await dbContext.Comments.AsNoTracking().SingleAsync(item => item.TaskId == movedTask.Id);
        Assert.Equal("Важно", comment.Content);
        var storedColumnId = await dbContext.KanbanTasks
            .AsNoTracking()
            .Where(task => task.Id == movedTask.Id)
            .Select(task => task.ColumnId)
            .SingleAsync();
        Assert.Equal(targetColumn.Id, storedColumnId);
    }

    [Fact]
    public async Task Reset_RestoresInitialBoardContent()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");
        var board = await CreateBoardAsync(client);

        var changed = AsUpdateRequest(board, "Изменённая доска") with
        {
            Columns = board.Columns.Select(column => column.Order == 0
                ? ToUpdateColumn(column, column.Order, Array.Empty<UpdateBoardTaskRequest>())
                : ToUpdateColumn(column, column.Order)).ToList(),
        };
        var changeResponse = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", changed, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, changeResponse.StatusCode);
        var modified = (await changeResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Empty(modified.Columns[0].Tasks);
        Assert.Equal("Изменённая доска", modified.Title);

        var resetResponse = await SendJsonAsync(client, HttpMethod.Post, $"/api/boards/{board.Id}/reset", body: null, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);
        var reset = (await resetResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Equal("Изменённая доска", reset.Title);
        Assert.Equal(modified.Version + 1, reset.Version);
        Assert.Equal(3, reset.Columns.Count);
        Assert.Equal(3, reset.Columns[0].Tasks.Count);
        Assert.Equal(2, reset.Columns[1].Tasks.Count);
        Assert.Single(reset.Columns[2].Tasks);

        var reloadedResponse = await client.GetAsync($"/api/boards/{board.Id}");
        var reloaded = (await reloadedResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Equal(reset.Version, reloaded.Version);
        Assert.Equal(3, reloaded.Columns[0].Tasks.Count);
    }

    [Fact]
    public async Task Reset_HidesBoardsOwnedByAnotherUser()
    {
        using var ownerClient = CreateClient();
        await LoginAsync(ownerClient, "student@kanbex.local", "Student1");
        var board = await CreateBoardAsync(ownerClient);

        using var otherClient = CreateClient();
        await RegisterAsync(otherClient, $"reset-{Guid.NewGuid():N}@kanbex.local");

        var response = await SendJsonAsync(otherClient, HttpMethod.Post,
            $"/api/boards/{board.Id}/reset", body: null, await GetTokenAsync(otherClient));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_RemovesColumnsAndReordersTheRest()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");
        var board = await CreateBoardAsync(client);

        var remaining = board.Columns.Skip(1).ToList();
        var request = AsUpdateRequest(board, board.Title) with
        {
            Columns = remaining
                .Select((column, index) => ToUpdateColumn(column, index))
                .ToList(),
        };

        var response = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}", request, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = (await response.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Equal(2, updated.Columns.Count);
        Assert.Equal(remaining[0].Id, updated.Columns[0].Id);
        Assert.Equal(0, updated.Columns[0].Order);
        Assert.Equal(1, updated.Columns[1].Order);
    }

    [Fact]
    public async Task CreateFromTemplate_SeedsPresetColumnsAndTasks()
    {
        using var client = CreateClient();
        await LoginAsync(client, "student@kanbex.local", "Student1");
        var token = await GetTokenAsync(client);

        var createResponse = await SendJsonAsync(client, HttpMethod.Post, "/api/boards/template/developer", body: null, token);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var board = (await createResponse.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
        Assert.Equal("Пет-проект", board.Title);
        Assert.Equal(4, board.Columns.Count);
        Assert.Equal("Backlog", board.Columns[0].Title);
        Assert.Equal(3, board.Columns[0].Tasks.Count);
        Assert.Equal(2, board.Columns[1].WipLimit);
        Assert.Single(board.Columns[3].Tasks);

        Assert.Equal(HttpStatusCode.NotFound,
            (await SendJsonAsync(client, HttpMethod.Post, "/api/boards/template/unknown", body: null, token)).StatusCode);
    }

    private static UpdateBoardRequest AsUpdateRequest(BoardResponse board, string title) => new(
        title,
        board.Description,
        board.Version,
        board.Columns.Select(column => new UpdateBoardColumnRequest(
            column.Id,
            column.Title,
            column.WipLimit,
            column.Order,
            column.Tasks.Select(task => new UpdateBoardTaskRequest(task.Id, task.Title, task.Description, task.Priority, task.Order)).ToList())).ToList());

    private static UpdateBoardColumnRequest ToUpdateColumn(
        BoardColumnResponse column,
        int order,
        IReadOnlyList<UpdateBoardTaskRequest>? tasks = null) => new(
            column.Id,
            column.Title,
            column.WipLimit,
            order,
            tasks ?? column.Tasks
                .Select(task => new UpdateBoardTaskRequest(task.Id, task.Title, task.Description, task.Priority, task.Order))
                .ToList());

    private async Task<BoardResponse> CreateBoardAsync(HttpClient client)
    {
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/boards",
            new { title = $"Board {Guid.NewGuid():N}", description = "" }, await GetTokenAsync(client));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<BoardResponse>(JsonOptions))!;
    }

    private async Task AddCommentAsync(Guid taskId, string authorId)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KanbexDbContext>();
        var now = DateTime.UtcNow;
        dbContext.Comments.Add(new Comment
        {
            TaskId = taskId,
            AuthorId = authorId,
            Content = "Важно",
            CreatedAt = now,
            UpdatedAt = now,
        });
        await dbContext.SaveChangesAsync();
    }

    private HttpClient CreateClient() => _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    });

    private static async Task LoginAsync(HttpClient client, string email, string password)
    {
        var token = await GetTokenAsync(client);
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/auth/login", new { email, password }, token);
        response.EnsureSuccessStatusCode();
        _ = await GetTokenAsync(client);
    }

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        var token = await GetTokenAsync(client);
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/auth/register",
            new { displayName = "Other User", email, password = "Student1" }, token);
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

    private static async Task<HttpResponseMessage> SendJsonAsync(HttpClient client, HttpMethod method, string url, object? body, string? token)
    {
        using var request = new HttpRequestMessage(method, url);
        if (body is not null) request.Content = JsonContent.Create(body);
        if (token is not null) request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request);
    }
}
