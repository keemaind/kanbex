using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>
/// Комментарии карточки. Читают и создают Creator/Member; удаляет автор своего
/// комментария или Creator — любой. Все операции проверяют участие в доске.
/// </summary>
public sealed class CommentService(KanbexDbContext dbContext, ProjectAccessService accessService)
{
    public async Task<AccessResult<IReadOnlyList<CommentResponse>>> ListAsync(
        Guid boardId,
        Guid taskId,
        string userId,
        CancellationToken cancellationToken)
    {
        var accessible = await IsTaskAccessibleAsync(boardId, taskId, userId, cancellationToken);
        if (!accessible)
        {
            return AccessResult<IReadOnlyList<CommentResponse>>.NotFound;
        }

        var comments = await dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.TaskId == taskId)
            .OrderBy(comment => comment.CreatedAt)
            .Select(comment => new CommentResponse(
                comment.Id,
                comment.TaskId,
                comment.Content,
                comment.AuthorId,
                comment.Author.DisplayName,
                comment.CreatedAt))
            .ToListAsync(cancellationToken);

        return AccessResult<IReadOnlyList<CommentResponse>>.Ok(comments);
    }

    public async Task<AccessResult<CommentResponse>> CreateAsync(
        Guid boardId,
        Guid taskId,
        string userId,
        CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        var accessible = await IsTaskAccessibleAsync(boardId, taskId, userId, cancellationToken);
        if (!accessible)
        {
            return AccessResult<CommentResponse>.NotFound;
        }

        var content = request.Content.Trim();
        if (content.Length is < 1 or > 4000)
        {
            throw new BoardValidationException("Комментарий должен содержать от 1 до 4000 символов.");
        }

        var now = DateTime.UtcNow;
        var comment = new Comment
        {
            TaskId = taskId,
            AuthorId = userId,
            Content = content,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Comments.Add(comment);
        await dbContext.SaveChangesAsync(cancellationToken);

        var authorName = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.DisplayName)
            .SingleAsync(cancellationToken);

        return AccessResult<CommentResponse>.Ok(new CommentResponse(
            comment.Id,
            comment.TaskId,
            comment.Content,
            comment.AuthorId,
            authorName,
            comment.CreatedAt));
    }

    public async Task<AccessResult<bool>> DeleteAsync(
        Guid boardId,
        Guid taskId,
        Guid commentId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<bool>.NotFound;
        }

        var comment = await dbContext.Comments
            .SingleOrDefaultAsync(
                candidate => candidate.Id == commentId && candidate.TaskId == taskId,
                cancellationToken);
        if (comment is null)
        {
            return AccessResult<bool>.NotFound;
        }

        var canDelete = role == ProjectMemberRole.Creator || comment.AuthorId == userId;
        if (!canDelete)
        {
            return AccessResult<bool>.Forbidden;
        }

        dbContext.Comments.Remove(comment);
        await dbContext.SaveChangesAsync(cancellationToken);
        return AccessResult<bool>.Ok(true);
    }

    private async Task<bool> IsTaskAccessibleAsync(
        Guid boardId,
        Guid taskId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return false;
        }

        return await dbContext.KanbanTasks
            .AsNoTracking()
            .AnyAsync(task => task.Id == taskId && task.ProjectId == boardId, cancellationToken);
    }
}
