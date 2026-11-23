using Kanbex.Infrastructure.Domain.Entities;
using Kanbex.Infrastructure.Domain.Enums;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Kanbex.Web.Services;

/// <summary>
/// Каталог тегов доски и привязка к задачам. Каталогом управляет Creator,
/// привязывать и снимать теги могут Creator и Member. Тег чужой доски
/// прикрепить нельзя — это дополнительно защищено связью `TaskTag.ProjectId`.
/// </summary>
public sealed class TagService(KanbexDbContext dbContext, ProjectAccessService accessService)
{
    public async Task<AccessResult<IReadOnlyList<TagResponse>>> ListAsync(
        Guid boardId,
        string userId,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<IReadOnlyList<TagResponse>>.NotFound;
        }

        var tags = await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tag.ProjectId == boardId)
            .OrderBy(tag => tag.Name)
            .Select(tag => new TagResponse(tag.Id, tag.Name, tag.Color))
            .ToListAsync(cancellationToken);

        return AccessResult<IReadOnlyList<TagResponse>>.Ok(tags);
    }

    public async Task<AccessResult<TagResponse>> CreateAsync(
        Guid boardId,
        string userId,
        CreateTagRequest request,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<TagResponse>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<TagResponse>.Forbidden;
        }

        var name = request.Name.Trim();
        var color = NormalizeColor(request.Color);
        await EnsureUniqueNameAsync(boardId, name, null, cancellationToken);

        var tag = new Tag { Name = name, Color = color, ProjectId = boardId };
        dbContext.Tags.Add(tag);
        await dbContext.SaveChangesAsync(cancellationToken);

        return AccessResult<TagResponse>.Ok(new TagResponse(tag.Id, tag.Name, tag.Color));
    }

    public async Task<AccessResult<TagResponse>> UpdateAsync(
        Guid boardId,
        Guid tagId,
        string userId,
        UpdateTagRequest request,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<TagResponse>.NotFound;
        }

        if (role != ProjectMemberRole.Creator)
        {
            return AccessResult<TagResponse>.Forbidden;
        }

        var tag = await dbContext.Tags
            .SingleOrDefaultAsync(candidate => candidate.Id == tagId && candidate.ProjectId == boardId,
                cancellationToken);
        if (tag is null)
        {
            return AccessResult<TagResponse>.NotFound;
        }

        var name = request.Name.Trim();
        await EnsureUniqueNameAsync(boardId, name, tagId, cancellationToken);

        tag.Name = name;
        tag.Color = NormalizeColor(request.Color);
        await dbContext.SaveChangesAsync(cancellationToken);

        return AccessResult<TagResponse>.Ok(new TagResponse(tag.Id, tag.Name, tag.Color));
    }

    public async Task<AccessResult<bool>> DeleteAsync(
        Guid boardId,
        Guid tagId,
        string userId,
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

        var tag = await dbContext.Tags
            .SingleOrDefaultAsync(candidate => candidate.Id == tagId && candidate.ProjectId == boardId,
                cancellationToken);
        if (tag is null)
        {
            return AccessResult<bool>.NotFound;
        }

        dbContext.Tags.Remove(tag);
        await dbContext.SaveChangesAsync(cancellationToken);
        return AccessResult<bool>.Ok(true);
    }

    public async Task<AccessResult<IReadOnlyList<TagResponse>>> SetTaskTagsAsync(
        Guid boardId,
        Guid taskId,
        string userId,
        UpdateTaskTagsRequest request,
        CancellationToken cancellationToken)
    {
        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null)
        {
            return AccessResult<IReadOnlyList<TagResponse>>.NotFound;
        }

        var taskExists = await dbContext.KanbanTasks
            .AsNoTracking()
            .AnyAsync(task => task.Id == taskId && task.ProjectId == boardId, cancellationToken);
        if (!taskExists)
        {
            return AccessResult<IReadOnlyList<TagResponse>>.NotFound;
        }

        var tagIds = request.TagIds.Distinct().ToList();
        var boardTags = await dbContext.Tags
            .AsNoTracking()
            .Where(tag => tag.ProjectId == boardId && tagIds.Contains(tag.Id))
            .ToListAsync(cancellationToken);
        if (boardTags.Count != tagIds.Count)
        {
            throw new BoardValidationException("Можно прикреплять только теги этой доски.");
        }

        var existing = await dbContext.TaskTags
            .Where(taskTag => taskTag.TaskId == taskId)
            .ToListAsync(cancellationToken);

        var existingTagIds = existing.Select(taskTag => taskTag.TagId).ToHashSet();
        var toAdd = tagIds.Where(tagIdValue => !existingTagIds.Contains(tagIdValue))
            .Select(tagIdValue => new TaskTag { TaskId = taskId, TagId = tagIdValue, ProjectId = boardId })
            .ToList();
        var toRemove = existing.Where(taskTag => !tagIds.Contains(taskTag.TagId)).ToList();

        if (toRemove.Count > 0) dbContext.TaskTags.RemoveRange(toRemove);
        if (toAdd.Count > 0) dbContext.TaskTags.AddRange(toAdd);
        await dbContext.SaveChangesAsync(cancellationToken);

        return AccessResult<IReadOnlyList<TagResponse>>.Ok(boardTags
            .OrderBy(tag => tag.Name)
            .Select(tag => new TagResponse(tag.Id, tag.Name, tag.Color))
            .ToList());
    }

    private async Task EnsureUniqueNameAsync(
        Guid boardId,
        string name,
        Guid? excludeTagId,
        CancellationToken cancellationToken)
    {
        if (name.Length is < 1 or > 64)
        {
            throw new BoardValidationException("Имя тега должно содержать от 1 до 64 символов.");
        }

        var duplicate = excludeTagId is null
            ? await dbContext.Tags
                .AsNoTracking()
                .AnyAsync(tag => tag.ProjectId == boardId && tag.Name == name, cancellationToken)
            : await dbContext.Tags
                .AsNoTracking()
                .AnyAsync(tag => tag.ProjectId == boardId && tag.Name == name && tag.Id != excludeTagId,
                    cancellationToken);
        if (duplicate)
        {
            throw new BoardValidationException("Тег с таким именем уже есть в доске.");
        }
    }

    private static string NormalizeColor(string color)
    {
        if (color.Length != 7 || color[0] != '#')
        {
            throw new BoardValidationException("Цвет задаётся в формате #RRGGBB.");
        }

        return color.ToUpperInvariant();
    }
}
