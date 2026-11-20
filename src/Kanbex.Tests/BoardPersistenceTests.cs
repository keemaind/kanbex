using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Kanbex.Tests;

public sealed class BoardPersistenceTests : IClassFixture<KanbexApiFactory>
{
    private readonly KanbexApiFactory _factory;

    public BoardPersistenceTests(KanbexApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DeletingProject_WithColumnsAndTasks_Succeeds()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<KanbexDbContext>();
        var ownerId = await db.Users.Select(user => user.Id).FirstAsync();

        var project = new Project
        {
            Name = $"Удаляемая доска {Guid.NewGuid():N}",
            OwnerId = ownerId,
        };
        var column = new KanbanColumn
        {
            Name = "В работе",
            SortOrder = 0,
            WipLimit = 2,
            Project = project,
        };
        var task = new KanbanTask
        {
            Title = "Задача",
            Column = column,
            Project = project,
            ReporterId = ownerId,
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync();

        db.Projects.Remove(project);
        await db.SaveChangesAsync();

        Assert.False(await db.Projects.AnyAsync(candidate => candidate.Id == project.Id));
        Assert.False(await db.Columns.AnyAsync(candidate => candidate.Id == column.Id));
        Assert.False(await db.KanbanTasks.AnyAsync(candidate => candidate.Id == task.Id));
    }
}
