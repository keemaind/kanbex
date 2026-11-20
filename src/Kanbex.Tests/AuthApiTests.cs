using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class AuthApiTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private readonly KanbexApiFactory _factory;

    public AuthApiTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AntiforgeryToken_ReturnsRequestTokenAndSetsCookie()
    {
        using var client = CreateClient();

        var response = await client.GetAsync("/api/auth/antiforgery-token");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.False(string.IsNullOrWhiteSpace(token?.RequestToken));
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            cookie => cookie.StartsWith("Kanbex.Antiforgery=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Me_WithoutCookieSession_ReturnsUnauthorized()
    {
        using var client = CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_OpensCookieSessionAndReturnsSafeCurrentUser()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);
        var email = $"student-{Guid.NewGuid():N}@kanbex.local";

        var response = await PostJsonAsync(
            client,
            "/api/auth/register",
            new { displayName = "Новый студент", email, password = DemoPassword },
            token);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var registered = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(registered);
        Assert.Equal(email, registered.Email);
        Assert.Equal("Новый студент", registered.DisplayName);
        Assert.False(string.IsNullOrWhiteSpace(registered.Id));
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            cookie => cookie.StartsWith("Kanbex.Auth=", StringComparison.Ordinal));

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var current = await meResponse.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.Equal(registered.Id, current?.Id);
        Assert.Equal(email, current?.Email);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsConflict()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);

        var response = await PostJsonAsync(
            client,
            "/api/auth/register",
            new { displayName = "Дубликат", email = DemoEmail, password = DemoPassword },
            token);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithDemoAccount_ReturnsCurrentUser()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);

        var response = await PostJsonAsync(
            client,
            "/api/auth/login",
            new { email = DemoEmail, password = DemoPassword },
            token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.Equal(DemoEmail, user?.Email);
        Assert.Equal("Студент Kanbex", user?.DisplayName);

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);

        var response = await PostJsonAsync(
            client,
            "/api/auth/login",
            new { email = DemoEmail, password = "Wrong1" },
            token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.False(
            response.Headers.TryGetValues("Set-Cookie", out var cookies)
            && cookies.Any(cookie => cookie.StartsWith("Kanbex.Auth=", StringComparison.Ordinal)));
    }

    [Fact]
    public async Task MutatingEndpoints_WithoutAntiforgeryToken_ReturnBadRequest()
    {
        using var client = CreateClient();

        var loginResponse = await PostJsonAsync(
            client,
            "/api/auth/login",
            new { email = DemoEmail, password = DemoPassword },
            token: null);
        var registerResponse = await PostJsonAsync(
            client,
            "/api/auth/register",
            new { displayName = "Без токена", email = $"no-token-{Guid.NewGuid():N}@kanbex.local", password = DemoPassword },
            token: null);

        Assert.Equal(HttpStatusCode.BadRequest, loginResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, registerResponse.StatusCode);
    }

    [Fact]
    public async Task Logout_ClearsCookieSession()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);
        var loginResponse = await PostJsonAsync(
            client,
            "/api/auth/login",
            new { email = DemoEmail, password = DemoPassword },
            token);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // После входа antiforgery-токен нужно получить заново: он привязан
        // к текущему пользователю.
        var logoutToken = await GetAntiforgeryTokenAsync(client);
        var logoutResponse = await PostJsonAsync(client, "/api/auth/logout", body: null, logoutToken);

        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }

    [Fact]
    public async Task Logout_WithoutAntiforgeryToken_KeepsSession()
    {
        using var client = CreateClient();
        var token = await GetAntiforgeryTokenAsync(client);
        var loginResponse = await PostJsonAsync(
            client,
            "/api/auth/login",
            new { email = DemoEmail, password = DemoPassword },
            token);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var logoutResponse = await PostJsonAsync(client, "/api/auth/logout", body: null, token: null);

        Assert.Equal(HttpStatusCode.BadRequest, logoutResponse.StatusCode);
        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
    }

    private HttpClient CreateClient() =>
        _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });

    private static async Task<string> GetAntiforgeryTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/auth/antiforgery-token");
        response.EnsureSuccessStatusCode();

        var token = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.False(string.IsNullOrWhiteSpace(token?.RequestToken));
        return token!.RequestToken!;
    }

    private static Task<HttpResponseMessage> PostJsonAsync(
        HttpClient client,
        string url,
        object? body,
        string? token)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        if (token is not null)
        {
            request.Headers.Add("X-CSRF-TOKEN", token);
        }

        return client.SendAsync(request);
    }

    private sealed record TokenResponse(string RequestToken);

    private sealed record CurrentUserResponse(string Id, string DisplayName, string Email);
}
