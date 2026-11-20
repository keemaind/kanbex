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
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        return Ok(await boardService.ListAsync(ownerId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<BoardResponse>> Create(
        [FromBody] CreateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();

        try
        {
            var board = await boardService.CreateAsync(request, ownerId, cancellationToken);
            return CreatedAtAction(nameof(Details), new { boardId = board.Id }, board);
        }
        catch (BoardValidationException exception)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Некорректная доска.",
                detail: exception.Message);
        }
    }

    [HttpGet("{boardId:guid}")]
    public async Task<ActionResult<BoardResponse>> Details(Guid boardId, CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var board = await boardService.GetAsync(boardId, ownerId, cancellationToken);
        return board is null ? NotFoundProblem() : Ok(board);
    }

    [HttpPut("{boardId:guid}")]
    public async Task<ActionResult<BoardResponse>> Update(
        Guid boardId,
        [FromBody] UpdateBoardRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();

        try
        {
            var result = await boardService.UpdateAsync(boardId, ownerId, request, cancellationToken);
            if (result.IsNotFound) return NotFoundProblem();
            if (result.IsConflict) return ConflictProblem("Доска была изменена или нарушен WIP-лимит. Обновите данные и повторите попытку.");
            return Ok(result.Board);
        }
        catch (BoardValidationException exception)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Некорректная доска.",
                detail: exception.Message);
        }
    }

    [HttpPost("{boardId:guid}/reset")]
    public async Task<ActionResult<BoardResponse>> Reset(Guid boardId, CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var board = await boardService.ResetAsync(boardId, ownerId, cancellationToken);
        return board is null ? NotFoundProblem() : Ok(board);
    }

    [HttpDelete("{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId, CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        return await boardService.DeleteAsync(boardId, ownerId, cancellationToken) ? NoContent() : NotFoundProblem();
    }

    private string? GetOwnerId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private ObjectResult NotFoundProblem() => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Доска не найдена.",
        detail: "Доска не существует или недоступна текущему пользователю.");

    private ObjectResult ConflictProblem(string detail) => Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "Конфликт доски.",
        detail: detail);
}
