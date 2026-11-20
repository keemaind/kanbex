using System.Reflection;
using Kanbex.Web.Controllers.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Xunit;

namespace Kanbex.Tests;

public sealed class ApiControllerTests
{
    [Fact]
    public void BoardEndpoints_AreAuthorizedAndExposeExpectedRoutes()
    {
        var controller = typeof(BoardsController);
        Assert.NotNull(controller.GetCustomAttribute<AuthorizeAttribute>());
        Assert.Equal("api/boards", controller.GetCustomAttribute<RouteAttribute>()?.Template);

        AssertEndpoint<BoardsController>(nameof(BoardsController.List), false, HttpMethods.Get);
        AssertEndpoint<BoardsController>(nameof(BoardsController.Create), false, HttpMethods.Post);
        AssertEndpoint<BoardsController>(nameof(BoardsController.Details), false, HttpMethods.Get);
        AssertEndpoint<BoardsController>(nameof(BoardsController.Update), false, HttpMethods.Put);
        AssertEndpoint<BoardsController>(nameof(BoardsController.Delete), false, HttpMethods.Delete);
    }

    [Fact]
    public void AuthEndpoints_HaveExpectedRoutesAndAccess()
    {
        var type = typeof(AuthController);
        Assert.Equal("api/auth", type.GetCustomAttribute<RouteAttribute>()?.Template);

        AssertEndpoint<AuthController>(nameof(AuthController.Register), allowAnonymous: true, HttpMethods.Post);
        AssertEndpoint<AuthController>(nameof(AuthController.Login), allowAnonymous: true, HttpMethods.Post);
        AssertEndpoint<AuthController>(nameof(AuthController.Logout), allowAnonymous: false, HttpMethods.Post);
        AssertEndpoint<AuthController>(nameof(AuthController.Me), allowAnonymous: false, HttpMethods.Get);
        AssertEndpoint<AuthController>(nameof(AuthController.AntiforgeryToken), allowAnonymous: true, HttpMethods.Get);

        var antiforgery = type.GetMethod(nameof(AuthController.AntiforgeryToken))!.GetCustomAttribute<HttpGetAttribute>();
        Assert.Equal("antiforgery-token", antiforgery?.Template);
    }

    private static void AssertEndpoint<TController>(string methodName, bool allowAnonymous, string httpMethod)
    {
        var method = typeof(TController).GetMethod(methodName)!;
        Assert.Equal(allowAnonymous, method.GetCustomAttribute<AllowAnonymousAttribute>() is not null);
        var controllerRequiresAuthorization = typeof(TController).GetCustomAttribute<AuthorizeAttribute>() is not null;
        Assert.Equal(!allowAnonymous, method.GetCustomAttribute<AuthorizeAttribute>() is not null || controllerRequiresAuthorization);
        Assert.NotNull(method.GetCustomAttributes<HttpMethodAttribute>().SingleOrDefault());
        Assert.Equal(httpMethod, method.GetCustomAttribute<HttpMethodAttribute>()?.HttpMethods.Single());
    }

}
