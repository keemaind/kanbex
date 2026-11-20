using Kanbex.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Kanbex.Tests;

public sealed class MigrationTests
{
    [Fact]
    public async Task Migrate_OnCleanSqliteDatabase_CreatesSchemaAndSeedsRoles()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<KanbexDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var dbContext = new KanbexDbContext(options);
        await dbContext.Database.MigrateAsync();

        var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();
        Assert.Equal("20261117200434_InitialCreate", Assert.Single(appliedMigrations));
        Assert.True(await dbContext.Database.CanConnectAsync());
        Assert.Equal(2, await dbContext.Roles.CountAsync());
        Assert.Contains(await dbContext.Database
            .SqlQueryRaw<string>("SELECT name AS Value FROM sqlite_master WHERE type = 'table'")
            .ToListAsync(), name => name == "Projects");
    }
}
