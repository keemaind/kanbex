using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

/// <summary>
/// Заготовка API аутентификации. Маршруты соответствуют architecture.md,
/// полноценная реализация Identity и cookie-сессии выполняется отдельным этапом.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private IActionResult NotImplemented(string operation) =>
        StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = $"Операция {operation} ещё не реализована: Identity подключён, но API-операции выполняются отдельным этапом."
        });

    [AllowAnonymous]
    [HttpPost("register")]
    public IActionResult Register() => NotImplemented("POST /api/auth/register");

    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login() => NotImplemented("POST /api/auth/login");

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() => NotImplemented("POST /api/auth/logout");

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => NotImplemented("GET /api/auth/me");
}
