using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kanbex.Tests;

public sealed class SpaHostTests : IClassFixture<KanbexApiFactory>
{
    private readonly KanbexApiFactory _factory;

    public SpaHostTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("/login")]
    [InlineData("/boards")]
    [InlineData("/boards/not-a-guid")]
    [InlineData("/missing-page")]
    public async Task ClientRoutes_ServeSpaHost(string path)
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task UnknownApiRoute_ReturnsNotFound()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/missing-endpoint");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
