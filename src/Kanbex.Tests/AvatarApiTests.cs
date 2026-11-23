using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class AvatarApiTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private readonly KanbexApiFactory _factory;

    public AvatarApiTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Upload_ReplaceAndDelete_Work()
    {
        using var client = CreateClient();
        await LoginAsync(client);
        var me = (await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;
        Assert.Null(me.AvatarUrl);

        var first = await UploadAsync(client, "avatar.png", FakePng(32), "image/png");
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var afterFirst = (await first.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
        Assert.NotNull(afterFirst.AvatarUrl);
        Assert.StartsWith("/uploads/", afterFirst.AvatarUrl);
        Assert.EndsWith(".png", afterFirst.AvatarUrl);

        var second = await UploadAsync(client, "avatar.webp", FakeWebp(32), "image/webp");
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var afterSecond = (await second.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
        Assert.NotEqual(afterFirst.AvatarUrl, afterSecond.AvatarUrl);
        Assert.EndsWith(".webp", afterSecond.AvatarUrl);

        var persisted = (await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;
        Assert.Equal(afterSecond.AvatarUrl, persisted.AvatarUrl);

        var delete = await SendAsync(client, HttpMethod.Delete, "/api/auth/avatar", null, await GetTokenAsync(client));
        Assert.Equal(HttpStatusCode.OK, delete.StatusCode);
        var afterDelete = (await delete.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
        Assert.Null(afterDelete.AvatarUrl);
        Assert.Null((await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!.AvatarUrl);
    }

    [Fact]
    public async Task Upload_RejectsWrongTypeAndOversizedFile()
    {
        using var client = CreateClient();
        await LoginAsync(client);

        var wrongType = await UploadAsync(client, "note.txt", System.Text.Encoding.UTF8.GetBytes("not an image"), "text/plain");
        Assert.Equal(HttpStatusCode.BadRequest, wrongType.StatusCode);

        var oversized = await UploadAsync(client, "big.png", FakePng(2 * 1024 * 1024 + 1), "image/png");
        Assert.Equal(HttpStatusCode.BadRequest, oversized.StatusCode);

        Assert.Null((await client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!.AvatarUrl);
    }

    [Fact]
    public async Task Upload_WithoutSession_IsUnauthorized()
    {
        using var client = CreateClient();
        var response = await UploadAsync(client, "avatar.png", FakePng(16), "image/png");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Upload_WithoutAntiforgeryToken_IsBadRequest()
    {
        using var client = CreateClient();
        await LoginAsync(client);

        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(FakePng(16));
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(file, "file", "avatar.png");

        var response = await client.PostAsync("/api/auth/avatar", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpResponseMessage> UploadAsync(
        HttpClient client,
        string fileName,
        byte[] bytes,
        string contentType)
    {
        var token = await GetTokenAsync(client);
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(file, "file", fileName);

        return await SendAsync(client, HttpMethod.Post, "/api/auth/avatar", content, token);
    }

    private static byte[] FakePng(int length)
    {
        var bytes = new byte[Math.Max(length, 8)];
        new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }.CopyTo(bytes, 0);
        return bytes;
    }

    private static byte[] FakeWebp(int length)
    {
        var bytes = new byte[Math.Max(length, 12)];
        "RIFF"u8.ToArray().CopyTo(bytes, 0);
        "WEBP"u8.ToArray().CopyTo(bytes, 8);
        return bytes;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    });

    private static async Task LoginAsync(HttpClient client)
    {
        var response = await SendAsync(client, HttpMethod.Post, "/api/auth/login",
            JsonContent.Create(new { email = DemoEmail, password = DemoPassword }), await GetTokenAsync(client));
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

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient client, HttpMethod method, string url, HttpContent? body, string? token)
    {
        using var request = new HttpRequestMessage(method, url);
        if (body is not null) request.Content = body;
        if (token is not null) request.Headers.Add("X-CSRF-TOKEN", token);
        return await client.SendAsync(request);
    }
}
