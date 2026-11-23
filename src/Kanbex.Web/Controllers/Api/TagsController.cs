using System.Security.Claims;
using Kanbex.Web.Contracts;
using Kanbex.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

[ApiController]
[Authorize]
[Route("api/boards/{boardId:guid}/tags")]
public sealed class TagsController(TagService tagService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TagResponse>>> List(Guid boardId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return ToActionResult(await tagService.ListAsync(boardId, userId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<TagResponse>> Create(
        Guid boardId,
        [FromBody] CreateTagRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await tagService.CreateAsync(boardId, userId, request, cancellationToken);
            return ToActionResult(result);
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    [HttpPut("{tagId:guid}")]
    public async Task<ActionResult<TagResponse>> Update(
        Guid boardId,
        Guid tagId,
        [FromBody] UpdateTagRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await tagService.UpdateAsync(boardId, tagId, userId, request, cancellationToken);
            return ToActionResult(result);
        }
        catch (BoardValidationException exception)
        {
            return ValidationProblem(exception);
        }
    }

    [HttpDelete("{tagId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId, Guid tagId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var result = await tagService.DeleteAsync(boardId, tagId, userId, cancellationToken);
        if (result.IsNotFound) return NotFoundProblem();
        if (result.IsForbidden) return ForbiddenProblem();
        return NoContent();
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
        title: "Тег не найден.",
        detail: "Доска или тег не существует либо недоступна текущему пользователю.");

    private ObjectResult ForbiddenProblem() => Problem(
        statusCode: StatusCodes.Status403Forbidden,
        title: "Недостаточно прав.",
        detail: "Управлять каталогом тегов может только владелец доски.");

    private ObjectResult ValidationProblem(BoardValidationException exception) => Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "Некорректный тег.",
        detail: exception.Message);
}
