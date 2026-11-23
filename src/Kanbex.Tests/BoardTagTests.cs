using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardTagTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public BoardTagTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Creator_ManagesCatalog()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);

        var create = await SendJsonAsync(client, HttpMethod.Post, $"/api/boards/{board.Id}/tags",
            new { name = "  UI  ", color = "#7979ff" }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var tag = (await create.Content.ReadFromJsonAsync<TagResponse>(JsonOptions))!;
        Assert.Equal("UI", tag.Name);
        Assert.Equal("#7979FF", tag.Color);

        var list = (await client.GetFromJsonAsync<List<TagResponse>>($"/api/boards/{board.Id}/tags", JsonOptions))!;
        Assert.Single(list);

        var update = await SendJsonAsync(client, HttpMethod.Put, $"/api/boards/{board.Id}/tags/{tag.Id}",
            new { name = "Frontend", color = "#42E65A" }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var updated = (await update.Content.ReadFromJsonAsync<TagResponse>(JsonOptions))!;
        Assert.Equal("Frontend", updated.Name);

        var delete = await SendJsonAsync(client, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tags/{tag.Id}", null, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        list = (await client.GetFromJsonAsync<List<TagResponse>>($"/api/boards/{board.Id}/tags", JsonOptions))!;
        Assert.Empty(list);
    }

    [Fact]
    public async Task Validation_RejectsBadColorDuplicateAndInvalidName()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);

        Assert.Equal(HttpStatusCode.BadRequest, (await SendJsonAsync(client, HttpMethod.Post,
            $"/api/boards/{board.Id}/tags", new { name = "Tag", color = "green" }, await GetTokenAsync(client))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await SendJsonAsync(client, HttpMethod.Post,
            $"/api/boards/{board.Id}/tags", new { name = "  ", color = "#123456" }, await GetTokenAsync(client))).StatusCode);

        var first = await SendJsonAsync(client, HttpMethod.Post, $"/api/boards/{board.Id}/tags",
            new { name = "Duplicate", color = "#123456" }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var duplicate = await SendJsonAsync(client, HttpMethod.Post, $"/api/boards/{board.Id}/tags",
            new { name = "Duplicate", color = "#654321" }, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
    }

    [Fact]
    public async Task Member_CannotManageCatalog_ButCanAttachTags()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);
        var taskId = board.Columns[0].Tasks[0].Id;

        var tag = (await (await SendJsonAsync(creator, HttpMethod.Post, $"/api/boards/{board.Id}/tags",
            new { name = "Shared", color = "#123456" }, await GetTokenAsync(creator)))
            .Content.ReadFromJsonAsync<TagResponse>(JsonOptions))!;

        using var member = CreateClient();
        var memberEmail = await RegisterAsync(member, "tag-member");
        await SendJsonAsync(creator, HttpMethod.Post, $"/api/boards/{board.Id}/members",
            new { email = memberEmail }, await GetTokenAsync(creator));

        Assert.Equal(HttpStatusCode.Forbidden, (await SendJsonAsync(member, HttpMethod.Post,
            $"/api/boards/{board.Id}/tags", new { name = "Own", color = "#111111" },
            await GetTokenAsync(member))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await SendJsonAsync(member, HttpMethod.Delete,
            $"/api/boards/{board.Id}/tags/{tag.Id}", null, await GetTokenAsync(member))).StatusCode);

        var attach = await SendJsonAsync(member, HttpMethod.Put,
            $"/api/boards/{board.Id}/tasks/{taskId}/tags", new { tagIds = new[] { tag.Id } },
            await GetTokenAsync(member));
        Assert.True(attach.StatusCode == HttpStatusCode.OK,
            $"Expected OK, got {(int)attach.StatusCode}: {await attach.Content.ReadAsStringAsync()}");

        var reloaded = (await member.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        var task = reloaded.Columns[0].Tasks.Single(candidate => candidate.Id == taskId);
        Assert.Single(task.Tags!);
        Assert.Equal(tag.Id, task.Tags![0].Id);

        // Снять тег повторным сохранением пустого набора.
        var detach = await SendJsonAsync(member, HttpMethod.Put,
            $"/api/boards/{board.Id}/tasks/{taskId}/tags", new { tagIds = Array.Empty<Guid>() },
            await GetTokenAsync(member));
        Assert.Equal(HttpStatusCode.OK, detach.StatusCode);
        reloaded = (await member.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        Assert.Empty(reloaded.Columns[0].Tasks.Single(candidate => candidate.Id == taskId).Tags!);
    }

    [Fact]
    public async Task CannotAttachTagFromAnotherBoard()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var boardA = await CreateBoardAsync(owner);
        var boardB = await CreateBoardAsync(owner);
        var taskId = boardA.Columns[0].Tasks[0].Id;

        var foreignTag = (await (await SendJsonAsync(owner, HttpMethod.Post, $"/api/boards/{boardB.Id}/tags",
            new { name = "Foreign", color = "#ABCDEF" }, await GetTokenAsync(owner)))
            .Content.ReadFromJsonAsync<TagResponse>(JsonOptions))!;

        var response = await SendJsonAsync(owner, HttpMethod.Put,
            $"/api/boards/{boardA.Id}/tasks/{taskId}/tags", new { tagIds = new[] { foreignTag.Id } },
            await GetTokenAsync(owner));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task NonMember_CannotAccessTags()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(owner);

        using var stranger = CreateClient();
        await RegisterAsync(stranger, "tag-stranger");

        Assert.Equal(HttpStatusCode.NotFound,
            (await stranger.GetAsync($"/api/boards/{board.Id}/tags")).StatusCode);
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
