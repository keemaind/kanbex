using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kanbex.Infrastructure.Persistence;

public sealed class KanbexDbContextFactory : IDesignTimeDbContextFactory<KanbexDbContext>
{
    public KanbexDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<KanbexDbContext>()
            .UseSqlite($"Data Source={ResolveDatabasePath()}")
            .Options;

        return new KanbexDbContext(options);
    }

    // Команды dotnet ef запускаются из разных каталогов, поэтому ищем корень
    // решения и используем ту же базу, что и веб-приложение.
    private static string ResolveDatabasePath()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (directory is not null &&
               !File.Exists(Path.Combine(directory.FullName, "Kanbex.sln")))
        {
            directory = directory.Parent;
        }

        var root = directory?.FullName ?? Directory.GetCurrentDirectory();
        return Path.Combine(root, "src", "Kanbex.Web", "kanbex.db");
    }
}
