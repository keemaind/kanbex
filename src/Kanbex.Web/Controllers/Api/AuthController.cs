using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

/// <summary>
/// Заготовка API аутентификации. Маршруты зафиксированы по architecture.md,
/// реализация Identity и cookie-сессии выполняется отдельным этапом.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private IActionResult NotImplemented(string operation) =>
        StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = $"Операция {operation} ещё не реализована: Identity подключается отдельным этапом."
        });

    [HttpPost("register")]
    public IActionResult Register() => NotImplemented("POST /api/auth/register");

    [HttpPost("login")]
    public IActionResult Login() => NotImplemented("POST /api/auth/login");

    [HttpPost("logout")]
    public IActionResult Logout() => NotImplemented("POST /api/auth/logout");

    [HttpGet("me")]
    public IActionResult Me() => NotImplemented("GET /api/auth/me");
}
