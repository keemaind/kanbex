using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers;

/// <summary>
/// MVC-хост React-острова для списка досок и конкретной доски.
/// Поддерживаются и «серверный» путь <c>/board</c>, и клиентские пути
/// <c>/boards</c> из architecture.md, чтобы прямое открытие URL не давало 404.
/// </summary>
public class BoardPageController : Controller
{
    [HttpGet("/board")]
    [HttpGet("/boards")]
    public IActionResult Index() => View("~/Views/Board/Index.cshtml");

    [HttpGet("/board/{boardId:guid}")]
    [HttpGet("/boards/{boardId:guid}")]
    public IActionResult Details(Guid boardId)
    {
        // Идентификатор передаётся React через URL; существование и доступ
        // проверит GET /api/boards/{boardId} после подключения API.
        ViewData["BoardId"] = boardId;
        return View("~/Views/Board/Index.cshtml");
    }
}
