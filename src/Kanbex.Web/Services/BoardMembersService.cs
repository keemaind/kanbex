using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Identity;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>
/// Участники доски. Управлять ими может только Creator; Member видит список.
/// Повторное добавление и добавление владельца отклоняются.
/// </summary>
public sealed class BoardMembersService(
    KanbexDbContext dbContext,
    ProjectAccessService accessService,
    UserManager<ApplicationUser> userManager)
{
    public async Task<AccessResult<IReadOnlyList<BoardMemberResponse>>> ListAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<IReadOnlyList<BoardMemberResponse>>.NotFound;
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(candidate => candidate.Owner)
            .Include(candidate => candidate.Members)
            .ThenInclude(member => member.User)
            .SingleAsync(candidate => candidate.Id == boardId, cancellationToken);

        var members = new List<BoardMemberResponse>
        {
            new(project.Owner.Id, project.Owner.DisplayName, ProjectMemberRole.Creator, project.CreatedAt, project.Owner.AvatarUrl),
        };

        members.AddRange(project.Members
            .OrderBy(member => member.JoinedAt)
            .Select(member => new BoardMemberResponse(
                member.UserId,
                member.User.DisplayName,
                member.Role,
                member.JoinedAt,
                member.User.AvatarUrl)));

        return AccessResult<IReadOnlyList<BoardMemberResponse>>.Ok(members);
    }

    public async Task<AccessResult<BoardMemberResponse>> AddAsync(
        Guid boardId,
        string userId,
        AddBoardMemberRequest request,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<BoardMemberResponse>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<BoardMemberResponse>.Forbidden;
        }

        var email = request.Email.Trim();
        var target = await userManager.FindByEmailAsync(email);
        if (target is null)
        {
            throw new BoardValidationException("Пользователь с таким e-mail не найден.");
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .SingleAsync(candidate => candidate.Id == boardId, cancellationToken);

        if (project.OwnerId == target.Id)
        {
            throw new BoardValidationException("Владелец доски уже является её участником.");
        }

        var exists = await dbContext.ProjectMembers
            .AsNoTracking()
            .AnyAsync(
                member => member.ProjectId == boardId && member.UserId == target.Id,
                cancellationToken);
        if (exists)
        {
            throw new BoardValidationException("Пользователь уже участвует в доске.");
        }

        var member = new ProjectMember
        {
            ProjectId = boardId,
            UserId = target.Id,
            Role = ProjectMemberRole.Member,
            JoinedAt = DateTime.UtcNow,
        };

        dbContext.ProjectMembers.Add(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        return AccessResult<BoardMemberResponse>.Ok(new BoardMemberResponse(
            target.Id,
            target.DisplayName,
            member.Role,
            member.JoinedAt,
            target.AvatarUrl));
    }

    public async Task<AccessResult<bool>> RemoveAsync(
        Guid boardId,
        string userId,
        string memberUserId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<bool>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<bool>.Forbidden;
        }

        if (memberUserId == userId)
        {
            throw new BoardValidationException("Владельца доски нельзя удалить из участников.");
        }

        var member = await dbContext.ProjectMembers
            .SingleOrDefaultAsync(
                candidate => candidate.ProjectId == boardId && candidate.UserId == memberUserId,
                cancellationToken);
        if (member is null)
        {
            return AccessResult<bool>.NotFound;
        }

        dbContext.ProjectMembers.Remove(member);
        await dbContext.SaveChangesAsync(cancellationToken);
        return AccessResult<bool>.Ok(true);
    }
}
