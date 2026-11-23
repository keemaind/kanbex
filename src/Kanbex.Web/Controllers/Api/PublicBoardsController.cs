using Kanbex.Web.Contracts;
using Kanbex.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

/// <summary>
/// Публичная read-only доска. Не требует сессии и отдаёт отдельный DTO без
/// e-mail, участников, комментариев, истории и идентификаторов пользователей.
/// Приватная и отсутствующая доска неразличимы — обе дают 404.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/public/boards")]
public sealed class PublicBoardsController(BoardService boardService) : ControllerBase
{
    [HttpGet("{boardId:guid}")]
    public async Task<ActionResult<PublicBoardResponse>> Details(Guid boardId, CancellationToken cancellationToken)
    {
        var board = await boardService.GetPublicAsync(boardId, cancellationToken);
        return board is null
            ? Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Доска не найдена.",
                detail: "Доска не существует или не опубликована.")
            : Ok(board);
    }
}
