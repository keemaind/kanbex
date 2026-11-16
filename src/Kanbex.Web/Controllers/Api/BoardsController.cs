using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

/// <summary>
/// Заготовка API досок. Маршруты соответствуют architecture.md; доступ,
/// владелец и WIP-правила будут проверяться на сервере при реализации.
/// </summary>
[ApiController]
[Route("api/boards")]
public sealed class BoardsController : ControllerBase
{
    private IActionResult NotImplemented(string operation) =>
        StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = $"Операция {operation} ещё не реализована: EF Core и доменная логика подключаются отдельным этапом."
        });

    [HttpGet]
    public IActionResult List() => NotImplemented("GET /api/boards");

    [HttpPost]
    public IActionResult Create() => NotImplemented("POST /api/boards");

    [HttpGet("{boardId:guid}")]
    public IActionResult Details(Guid boardId) => NotImplemented($"GET /api/boards/{boardId}");

    [HttpPut("{boardId:guid}")]
    public IActionResult Update(Guid boardId) => NotImplemented($"PUT /api/boards/{boardId}");

    [HttpDelete("{boardId:guid}")]
    public IActionResult Delete(Guid boardId) => NotImplemented($"DELETE /api/boards/{boardId}");
}
