using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers;

/// <summary>
/// Вводная MVC-страница и Razor-хост SPA для клиентских маршрутов,
/// которым не нужен отдельный контроллер.
/// </summary>
public class HomeController : Controller
{
    public IActionResult Index() => View();

    // Прямое открытие клиентских URL должно возвращать Razor-хост React,
    // иначе BrowserRouter получает 404 от сервера до запуска приложения.
    [HttpGet("/login")]
    [HttpGet("/register")]
    [HttpGet("/account")]
    public IActionResult Spa() => View("Index");

    // Клиентские вложенные пути доски (в том числе с невалидным boardId)
    // должен обслуживать Razor-хост: проверку формата GUID выполняет React.
    [HttpGet("/boards/{**rest}")]
    [HttpGet("/board/{**rest}")]
    public IActionResult BoardSpa() => View("Index");

    // Маршруты Identity UI из architecture.md. Полноценная Identity появится
    // позже; пока они перенаправляют на клиентские страницы входа/регистрации,
    // чтобы прямые ссылки не давали 404.
    [HttpGet("/Identity/Account/Login")]
    public IActionResult IdentityLogin() => Redirect("/login");

    [HttpGet("/Identity/Account/Register")]
    public IActionResult IdentityRegister() => Redirect("/register");

    [HttpGet("/Identity/Account/Logout")]
    [HttpPost("/Identity/Account/Logout")]
    public IActionResult IdentityLogout() => Redirect("/login");

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View();
}
