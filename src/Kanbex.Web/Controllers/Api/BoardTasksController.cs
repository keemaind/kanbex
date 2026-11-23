using System.Security.Claims;
using Kanbex.Web.Contracts;
using Kanbex.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

[ApiController]
[Authorize]
[Route("api/boards/{boardId:guid}/tasks")]
public sealed class BoardTasksController(
    ProjectAccessService accessService,
    TaskHistoryService historyService,
    CommentService commentService,
    TagService tagService) : ControllerBase
{
    [HttpGet("{taskId:guid}/history")]
    public async Task<ActionResult<IReadOnlyList<TaskHistoryResponse>>> History(
        Guid boardId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var role = await accessService.GetRoleAsync(boardId, userId, cancellationToken);
        if (role is null) return NotFoundProblem();

        var history = await historyService.ListAsync(boardId, taskId, cancellationToken);
        return history is null ? NotFoundProblem() : Ok(history);
    }

    [HttpGet("{taskId:guid}/comments")]
    public async Task<ActionResult<IReadOnlyList<CommentResponse>>> ListComments(
        Guid boardId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var result = await commentService.ListAsync(boardId, taskId, userId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("{taskId:guid}/comments")]
    public async Task<ActionResult<CommentResponse>> CreateComment(
        Guid boardId,
        Guid taskId,
        [FromBody] CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await commentService.CreateAsync(boardId, taskId, userId, request, cancellationToken);
            return ToActionResult(result);
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    [HttpDelete("{taskId:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(
        Guid boardId,
        Guid taskId,
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await commentService.DeleteAsync(boardId, taskId, commentId, userId, cancellationToken);
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        return NoContent();
    }

    [HttpPut("{taskId:guid}/tags")]
    public async Task<ActionResult<IReadOnlyList<TagResponse>>> SetTags(
        Guid boardId,
        Guid taskId,
        [FromBody] UpdateTaskTagsRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await tagService.SetTaskTagsAsync(boardId, taskId, userId, request, cancellationToken);
            return ToActionResult(result);
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    private ActionResult<T> ToActionResult<T>(AccessResult<T> result)
    {
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        return Ok(result.Value);
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private ObjectResult NotFoundProblem() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Карточка не найдена.",
        detail: "Доска или карточка не существует либо недоступна текущему пользователю.");

    private ObjectResult ForbiddenProblem() => Problem(
        statusCode: StatusCodes.Status403Forbidden,
        title: "Недостаточно прав.",
        detail: "Удалить можно только свой комментарий или любой комментарий доски как Creator.");

    private ObjectResult ValidationProblem(BoardValidationException exception) => Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "Некорректный комментарий.",
        detail: exception.Message);
}
