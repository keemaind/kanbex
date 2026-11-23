using System.Security.Claims;
using Kanbex.Web.Contracts;
using Kanbex.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

[ApiController]
[Authorize]
[Route("api/boards")]
public sealed class BoardsController(BoardService boardService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BoardSummaryResponse>>> List(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await boardService.ListAsync(userId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<BoardResponse>> Create(
        [FromBody] CreateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var board = await boardService.CreateAsync(request, userId, cancellationToken);
            return CreatedAtAction(nameof(Details), new { boardId = board.Id }, board);
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    [HttpPost("template/{templateKey}")]
    public async Task<ActionResult<BoardResponse>> CreateFromTemplate(string templateKey, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var board = await boardService.CreateFromTemplateAsync(templateKey, userId, cancellationToken);
        if (board is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Шаблон не найден.",
                detail: "Выберите один из доступных шаблонов доски.");
        }

        return CreatedAtAction(nameof(Details), new { boardId = board.Id }, board);
    }

    [HttpGet("{boardId:guid}")]
    public async Task<ActionResult<BoardResponse>> Details(Guid boardId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var result = await boardService.GetAsync(boardId, userId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{boardId:guid}")]
    public async Task<ActionResult<BoardResponse>> Update(
        Guid boardId,
        [FromBody] UpdateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await boardService.UpdateAsync(boardId, userId, request, cancellationToken);
            return ToActionResult(result, "Доска была изменена или нарушен WIP-лимит. Обновите данные и повторите попытку.");
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    [HttpPost("{boardId:guid}/reset")]
    public async Task<ActionResult<BoardResponse>> Reset(Guid boardId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var result = await boardService.ResetAsync(boardId, userId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{boardId:guid}/visibility")]
    public async Task<IActionResult> SetVisibility(
        Guid boardId,
        [FromBody] UpdateVisibilityRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await boardService.SetVisibilityAsync(boardId, userId, request.IsPublic, cancellationToken);
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        return NoContent();
    }

    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var result = await boardService.DeleteAsync(boardId, userId, cancellationToken);
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        return NoContent();
    }

    private ActionResult<T> ToActionResult<T>(AccessResult<T> result, string? conflictDetail = null)
    {
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        if (result.IsConflict) return ConflictProblem(conflictDetail ?? "Доска была изменена. Обновите данные и повторите попытку.");
        return Ok(result.Value);
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private ObjectResult NotFoundProblem() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Доска не найдена.",
        detail: "Доска не существует или недоступна текущему пользователю.");

    private ObjectResult ForbiddenProblem() => Problem(
        statusCode: StatusCodes.Status403Forbidden,
        title: "Недостаточно прав.",
        detail: "Действие доступно только владельцу доски.");

    private ObjectResult ConflictProblem(string detail) => Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "Конфликт доски.",
        detail: detail);

    private ObjectResult ValidationProblem(BoardValidationException exception) => Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "Некорректная доска.",
        detail: exception.Message);
}
