using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardCommentTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public BoardCommentTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Create_List_Delete_WorkForParticipant()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);
        var taskId = board.Columns[0].Tasks[0].Id;

        Assert.Empty((await client.GetFromJsonAsync<List<CommentResponse>>(
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", JsonOptions))!);

        var createResponse = await SendJsonAsync(client, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = "  Первый комментарий  " },
            await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var comment = (await createResponse.Content.ReadFromJsonAsync<CommentResponse>(JsonOptions))!;
        Assert.Equal("Первый комментарий", comment.Content);

        var list = (await client.GetFromJsonAsync<List<CommentResponse>>(
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", JsonOptions))!;
        Assert.Single(list);
        Assert.Equal(comment.Id, list[0].Id);
        Assert.False(string.IsNullOrWhiteSpace(list[0].AuthorName));

        // Счётчик комментариев в DTO доски учитывает новый комментарий.
        var reloaded = (await client.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        Assert.Equal(1, reloaded.Columns[0].Tasks.Single(task => task.Id == taskId).CommentCount);

        var deleteResponse = await SendJsonAsync(client, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments/{comment.Id}", null, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<CommentResponse>>(
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", JsonOptions))!);
    }

    [Fact]
    public async Task Validation_RejectsEmptyAndTooLongContent()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);
        var taskId = board.Columns[0].Tasks[0].Id;

        var empty = await SendJsonAsync(client, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = "   " }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);

        var tooLong = await SendJsonAsync(client, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = new string('a', 4001) },
            await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
    }

    [Fact]
    public async Task Delete_AuthorOrCreator_Only()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);
        var taskId = board.Columns[0].Tasks[0].Id;

        using var member = CreateClient();
        var memberEmail = await RegisterAsync(member, "commenter");
        await SendJsonAsync(creator, HttpMethod.Post, $"/api/boards/{board.Id}/members",
            new { email = memberEmail }, await GetTokenAsync(creator));

        var memberComment = (await (await SendJsonAsync(member, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = "Member comment" },
            await GetTokenAsync(member))).Content.ReadFromJsonAsync<CommentResponse>(JsonOptions))!;

        // Другой Member не удаляет чужой комментарий.
        using var other = CreateClient();
        var otherEmail = await RegisterAsync(other, "other-member");
        await SendJsonAsync(creator, HttpMethod.Post, $"/api/boards/{board.Id}/members",
            new { email = otherEmail }, await GetTokenAsync(creator));
        var forbidden = await SendJsonAsync(other, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments/{memberComment.Id}", null, await GetTokenAsync(other));
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        // Автор удаляет свой.
        var authorDelete = await SendJsonAsync(member, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments/{memberComment.Id}", null, await GetTokenAsync(member));
        Assert.Equal(HttpStatusCode.NoContent, authorDelete.StatusCode);

        // Creator удаляет любой.
        var creatorOwned = (await (await SendJsonAsync(member, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = "Another" },
            await GetTokenAsync(member))).Content.ReadFromJsonAsync<CommentResponse>(JsonOptions))!;
        var creatorDelete = await SendJsonAsync(creator, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments/{creatorOwned.Id}", null, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.NoContent, creatorDelete.StatusCode);
    }

    [Fact]
    public async Task NonMember_CannotReadOrCreate()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);
        var taskId = board.Columns[0].Tasks[0].Id;

        using var stranger = CreateClient();
        await RegisterAsync(stranger, "stranger");

        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/api/boards/{board.Id}/tasks/{taskId}/comments")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SendJsonAsync(stranger, HttpMethod.Post,
            $"/api/boards/{board.Id}/tasks/{taskId}/comments", new { content = "Hi" },
            await GetTokenAsync(stranger))).StatusCode);
    }

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

    private static async Task<string> RegisterAsync(HttpClient client, string prefix)
    {
        var email = $"{prefix}-{Guid.NewGuid():N}@kanbex.local";
        var response = await SendJsonAsync(client, HttpMethod.Post, "/api/auth/register",
            new { displayName = $"User {prefix}", email, password = DemoPassword },
            await GetTokenAsync(client));
        response.EnsureSuccessStatusCode();
        _ = await GetTokenAsync(client);
        return email;
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
