using Kanbex.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Kanbex.Tests;

/// <summary>
/// Поднимает настоящее приложение Kanbex на TestServer с отдельной
/// SQLite-базой в памяти. Миграции и сиды выполняет обычный запуск Program.
/// </summary>
public sealed class KanbexApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<KanbexDbContext>>();
            services.RemoveAll<KanbexDbContext>();

            _connection.Open();
            services.AddDbContext<KanbexDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
