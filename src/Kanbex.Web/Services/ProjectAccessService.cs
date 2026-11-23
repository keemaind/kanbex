using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>
/// Единая точка проверки доступа к доске. Creator — владелец проекта,
/// Member — приглашённый участник. Отсутствующая и чужая доска неразличимы.
/// </summary>
public sealed class ProjectAccessService(KanbexDbContext dbContext)
{
    public async Task<ProjectMemberRole?> GetRoleAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .Where(candidate => candidate.Id == boardId)
            .Select(candidate => candidate.OwnerId)
            .SingleOrDefaultAsync(cancellationToken);

        if (project is null)
        {
            return null;
        }

        if (project == userId)
        {
            return ProjectMemberRole.Creator;
        }

        var isMember = await dbContext.ProjectMembers
            .AsNoTracking()
            .AnyAsync(
                member => member.ProjectId == boardId && member.UserId == userId,
                cancellationToken);

        return isMember ? ProjectMemberRole.Member : null;
    }

    public async Task<bool> IsCreatorAsync(Guid boardId, string userId, CancellationToken cancellationToken) =>
        await GetRoleAsync(boardId, userId, cancellationToken) == ProjectMemberRole.Creator;

    public async Task<bool> IsMemberAsync(Guid boardId, string userId, CancellationToken cancellationToken) =>
        await GetRoleAsync(boardId, userId, cancellationToken) == ProjectMemberRole.Member;

    public async Task<IReadOnlyList<Guid>> GetAccessibleBoardIdsAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var owned = dbContext.Projects
            .AsNoTracking()
            .Where(project => project.OwnerId == userId)
            .Select(project => project.Id);

        var joined = dbContext.ProjectMembers
            .AsNoTracking()
            .Where(member => member.UserId == userId)
            .Select(member => member.ProjectId);

        return await owned.Union(joined).Distinct().ToListAsync(cancellationToken);
    }
}
