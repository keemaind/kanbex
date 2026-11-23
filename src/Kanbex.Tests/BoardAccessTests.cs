using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardAccessTests : IClassFixture<KanbexApiFactory>
{
    private const string DemoEmail = "student@kanbex.local";
    private const string DemoPassword = "Student1";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly KanbexApiFactory _factory;

    public BoardAccessTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Creator_SeesBoardWithCreatorRoleInList()
    {
        using var client = CreateClient();
        await LoginAsync(client, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(client);

        Assert.Equal(ProjectMemberRole.Creator, board.Role);
        Assert.False(board.IsPublic);

        var list = await client.GetFromJsonAsync<List<BoardSummaryResponse>>("/api/boards", JsonOptions);
        var summary = Assert.Single(list!, item => item.Id == board.Id);
        Assert.Equal(ProjectMemberRole.Creator, summary.Role);
    }

    [Fact]
    public async Task Member_CanReadAndEditContent_ButNotManageBoard()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);

        using var member = CreateClient();
        var memberEmail = await RegisterAsync(member, "member");
        var memberUser = (await member.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;

        var addResponse = await SendJsonAsync(creator, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = memberEmail }, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);

        var memberBoard = await member.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions);
        Assert.NotNull(memberBoard);
        Assert.Equal(ProjectMemberRole.Member, memberBoard.Role);

        var memberList = await member.GetFromJsonAsync<List<BoardSummaryResponse>>("/api/boards", JsonOptions);
        Assert.Contains(memberList!, item => item.Id == board.Id && item.Role == ProjectMemberRole.Member);

        // Member сохраняет содержимое без смены заголовка/описания.
        var contentUpdate = new UpdateBoardRequest(
            memberBoard!.Title,
            memberBoard.Description,
            memberBoard.Version,
            memberBoard.Columns.Select((column, index) => new UpdateBoardColumnRequest(
                column.Id,
                column.Title,
                column.WipLimit,
                column.Order,
                index == 0
                    ? column.Tasks
                        .Select(task => new UpdateBoardTaskRequest(
                            task.Id, task.Title, task.Description, task.Priority, task.Order))
                        .Append(new UpdateBoardTaskRequest(Guid.NewGuid(), "Member task", "", TaskPriority.Medium, column.Tasks.Count))
                        .ToList()
                    : column.Tasks
                        .Select(task => new UpdateBoardTaskRequest(
                            task.Id, task.Title, task.Description, task.Priority, task.Order))
                        .ToList())).ToList());
        var contentResponse = await SendJsonAsync(member, HttpMethod.Put, $"/api/boards/{board.Id}",
            contentUpdate, await GetTokenAsync(member));
        Assert.Equal(HttpStatusCode.OK, contentResponse.StatusCode);

        // Member не меняет title/description.
        var refreshed = (await member.GetFromJsonAsync<BoardResponse>($"/api/boards/{board.Id}", JsonOptions))!;
        var titleUpdate = AsUpdateRequest(refreshed, "Чужое название");
        var titleResponse = await SendJsonAsync(member, HttpMethod.Put, $"/api/boards/{board.Id}",
            titleUpdate, await GetTokenAsync(member));
        Assert.Equal(HttpStatusCode.Forbidden, titleResponse.StatusCode);

        // Member не сбрасывает и не удаляет доску.
        Assert.Equal(HttpStatusCode.Forbidden, (await SendJsonAsync(member, HttpMethod.Post,
            $"/api/boards/{board.Id}/reset", null, await GetTokenAsync(member))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await SendJsonAsync(member, HttpMethod.Delete,
            $"/api/boards/{board.Id}", null, await GetTokenAsync(member))).StatusCode);

        // Member не управляет участниками.
        var another = await RegisterAsync(CreateClient(), "another");
        Assert.Equal(HttpStatusCode.Forbidden, (await SendJsonAsync(member, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = another }, await GetTokenAsync(member))).StatusCode);

        // Creator удаляет участника; доступ сразу прекращается.
        var removeResponse = await SendJsonAsync(creator, HttpMethod.Delete,
            $"/api/boards/{board.Id}/members/{memberUser.Id}", null, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.NoContent, removeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await member.GetAsync($"/api/boards/{board.Id}")).StatusCode);
    }

    [Fact]
    public async Task NonMember_GetsNotFound_ForReadAndMutations()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);

        using var stranger = CreateClient();
        await RegisterAsync(stranger, "stranger");

        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/api/boards/{board.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await SendJsonAsync(stranger, HttpMethod.Delete,
            $"/api/boards/{board.Id}", null, await GetTokenAsync(stranger))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/api/boards/{board.Id}/members")).StatusCode);
    }

    [Fact]
    public async Task Members_ListAndAddValidateDuplicatesOwnerAndUnknownEmails()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);

        var members = await creator.GetFromJsonAsync<List<BoardMemberResponse>>(
            $"/api/boards/{board.Id}/members", JsonOptions);
        Assert.NotNull(members);
        var creatorMember = Assert.Single(members!);
        Assert.Equal(ProjectMemberRole.Creator, creatorMember.Role);

        var memberEmail = await RegisterAsync(CreateClient(), "joined");
        var addResponse = await SendJsonAsync(creator, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = memberEmail }, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);

        var duplicate = await SendJsonAsync(creator, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = memberEmail }, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);

        var owner = await SendJsonAsync(creator, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = DemoEmail }, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.BadRequest, owner.StatusCode);

        var unknown = await SendJsonAsync(creator, HttpMethod.Post,
            $"/api/boards/{board.Id}/members", new { email = $"nobody-{Guid.NewGuid():N}@kanbex.local" }, await GetTokenAsync(creator));
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);

        members = await creator.GetFromJsonAsync<List<BoardMemberResponse>>(
            $"/api/boards/{board.Id}/members", JsonOptions);
        Assert.Equal(2, members!.Count);
        Assert.Contains(members, member => member.Role == ProjectMemberRole.Member);
    }

    [Fact]
    public async Task Creator_CannotRemoveThemselves()
    {
        using var creator = CreateClient();
        await LoginAsync(creator, DemoEmail, DemoPassword);
        var board = await CreateBoardAsync(creator);
        var user = (await creator.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me"))!;

        var response = await SendJsonAsync(creator, HttpMethod.Delete,
            $"/api/boards/{board.Id}/members/{user.Id}", null, await GetTokenAsync(creator));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await creator.GetAsync($"/api/boards/{board.Id}")).StatusCode);
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
            column.Tasks.Select(task => new UpdateBoardTaskRequest(
                task.Id, task.Title, task.Description, task.Priority, task.Order)).ToList())).ToList());

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
            new { displayName = $"User {prefix}", email, password = DemoPassword }, await GetTokenAsync(client));
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
