using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kanbex.Infrastructure.Persistence;

public sealed class KanbexDbContextFactory : IDesignTimeDbContextFactory<KanbexDbContext>
{
    public KanbexDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<KanbexDbContext>()
            .UseSqlite("Data Source=kanbex.db")
            .Options;

        return new KanbexDbContext(options);
    }
}
