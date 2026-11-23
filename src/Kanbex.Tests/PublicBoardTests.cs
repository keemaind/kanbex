using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class PublicBoardTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public PublicBoardTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task PrivateBoard_IsNotFoundForAnonymous()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(owner);

        using var guest = CreateClient();
        var response = await guest.GetAsync($"/api/public/boards/{board.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // Несуществующая доска даёт такой же 404.
        Assert.Equal(HttpStatusCode.NotFound,
            (await guest.GetAsync($"/api/public/boards/{Guid.NewGuid()}")).StatusCode);
    }

    [Fact]
    public async Task PublicBoard_IsReadableAnonymously_WithoutPrivateFields()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(owner);

        var published = await SendJsonAsync(owner, HttpMethod.Put, $"/api/boards/{board.Id}/visibility",
            new { isPublic = true }, await GetTokenAsync(owner));
        Assert.Equal(HttpStatusCode.NoContent, published.StatusCode);

        using var guest = CreateClient();
        var response = await guest.GetAsync($"/api/public/boards/{board.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("@kanbex.local", json);
        Assert.DoesNotContain("ownerId", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("email", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("assigneeId", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("commentCount", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("version", json, StringComparison.OrdinalIgnoreCase);

        var publicBoard = JsonSerializer.Deserialize<PublicBoardResponse>(json, JsonOptions)!;
        Assert.Equal(board.Id, publicBoard.Id);
        Assert.Equal(3, publicBoard.Columns.Count);
        Assert.Equal(3, publicBoard.Columns[0].Tasks.Count);
    }

    [Fact]
    public async Task Guest_CannotMutate()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(owner);
        await SendJsonAsync(owner, HttpMethod.Put, $"/api/boards/{board.Id}/visibility",
            new { isPublic = true }, await GetTokenAsync(owner));

        using var guest = CreateClient();
        var taskId = board.Columns[0].Tasks[0].Id;

        Assert.Equal(HttpStatusCode.Unauthorized, (await guest.GetAsync($"/api/boards/{board.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await guest.GetAsync($"/api/boards/{board.Id}/tasks/{taskId}/comments")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await SendJsonAsync(guest, HttpMethod.Put,
            $"/api/boards/{board.Id}", new { }, token: null)).StatusCode);
    }

    [Fact]
    public async Task TogglingVisibilityOff_RemovesPublicAccess()
    {
        using var owner = CreateClient();
        await LoginAsync(owner, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(owner);

        await SendJsonAsync(owner, HttpMethod.Put, $"/api/boards/{board.Id}/visibility",
            new { isPublic = true }, await GetTokenAsync(owner));
        using var guest = CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await guest.GetAsync($"/api/public/boards/{board.Id}")).StatusCode);

        await SendJsonAsync(owner, HttpMethod.Put, $"/api/boards/{board.Id}/visibility",
            new { isPublic = false }, await GetTokenAsync(owner));
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync($"/api/public/boards/{board.Id}")).StatusCode);
    }

    [Fact]
    public async Task Member_CannotChangeVisibility()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);

        using var member = CreateClient();
        var memberEmail = await RegisterAsync(member, "visibility-member");
        await SendJsonAsync(creator, HttpMethod.Post, $"/api/boards/{board.Id}/members",
            new { email = memberEmail }, await GetTokenAsync(creator));

        var response = await SendJsonAsync(member, HttpMethod.Put, $"/api/boards/{board.Id}/visibility",
            new { isPublic = true }, await GetTokenAsync(member));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ShareHost_ServesSpaWithoutLogin()
    {
        using var guest = CreateClient();
        var response = await guest.GetAsync($"/share/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
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
