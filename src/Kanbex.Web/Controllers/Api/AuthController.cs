using Kanbex.Infrastructure.Identity;
using Kanbex.Web.Contracts;
using Kanbex.Web.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers.Api;

/// <summary>
/// API аутентификации на ASP.NET Core Identity. React и API работают на одном
/// origin, поэтому после входа браузер получает HttpOnly cookie-сессию
/// `Kanbex.Auth`. Изменяющие запросы дополнительно проверяют antiforgery-токен
/// из заголовка `X-CSRF-TOKEN`.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IAntiforgery _antiforgery;
    private readonly AvatarStorage _avatarStorage;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IAntiforgery antiforgery,
        AvatarStorage avatarStorage)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _antiforgery = antiforgery;
        _avatarStorage = avatarStorage;
    }

    /// <summary>
    /// Выдаёт request token и устанавливает antiforgery-cookie. Клиент вызывает
    /// этот метод перед первым изменяющим запросом и кеширует токен до перезагрузки.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("antiforgery-token")]
    public IActionResult AntiforgeryToken()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new { requestToken = tokens.RequestToken });
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var email = request.Email.Trim();
        var displayName = request.DisplayName.Trim();
        if (displayName.Length < 2)
        {
            ModelState.AddModelError(
                nameof(RegisterRequest.DisplayName),
                "Имя должно содержать минимум два символа.");
            return ValidationProblem(ModelState);
        }

        if (await _userManager.FindByEmailAsync(email) is not null)
        {
            return ConflictProblem("Этот e-mail уже зарегистрирован.");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            if (createResult.Errors.Any(error => error.Code is "DuplicateEmail" or "DuplicateUserName"))
            {
                return ConflictProblem("Этот e-mail уже зарегистрирован.");
            }

            return ValidationProblemResult(createResult);
        }

        await _userManager.AddToRoleAsync(user, IdentityRoleNames.User);

        // Регистрация сразу открывает cookie-сессию, чтобы клиенту не нужен
        // был отдельный запрос входа после создания аккаунта.
        await _signInManager.SignInAsync(user, isPersistent: false);
        return StatusCode(StatusCodes.Status201Created, ToResponse(user));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return UnauthorizedProblem("Неверный e-mail или пароль.");
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return Problem(
                statusCode: StatusCodes.Status423Locked,
                title: "Учётная запись временно заблокирована.",
                detail: "Слишком много неудачных попыток входа. Повторите позже.");
        }

        if (!result.Succeeded)
        {
            return UnauthorizedProblem("Неверный e-mail или пароль.");
        }

        return Ok(ToResponse(user));
    }

    /// <summary>
    /// Обновляет отображаемое имя текущего пользователя. Cookie обновлять не
    /// нужно: `/api/auth/me` читает имя из сущности, а не из клеймов.
    /// </summary>
    [Authorize]
    [HttpPost("display-name")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return UnauthorizedProblem("Сессия не найдена. Войдите снова.");
        }

        var displayName = request.DisplayName.Trim();
        if (displayName.Length is < 2 or > 120)
        {
            ModelState.AddModelError(
                nameof(UpdateDisplayNameRequest.DisplayName),
                "Имя должно содержать от 2 до 120 символов.");
            return ValidationProblem(ModelState);
        }

        user.DisplayName = displayName;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return ValidationProblemResult(result);
        }

        return Ok(ToResponse(user));
    }

    /// <summary>
    /// Меняет пароль и обновляет security stamp в текущей cookie-сессии, чтобы
    /// пользователю не приходилось входить заново.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return UnauthorizedProblem("Сессия не найдена. Войдите снова.");
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!result.Succeeded)
        {
            // Неверный текущий пароль и нарушения политики Identity возвращаются
            // как ValidationProblem с ключами кодов Identity (PasswordMismatch,
            // PasswordTooShort и т.п.).
            return ValidationProblemResult(result);
        }

        await _signInManager.RefreshSignInAsync(user);
        return Ok(ToResponse(user));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return UnauthorizedProblem("Сессия не найдена. Войдите снова.");
        }

        return Ok(ToResponse(user));
    }

    [Authorize]
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return UnauthorizedProblem("Сессия не найдена. Войдите снова.");
        }

        if (file is null)
        {
            ModelState.AddModelError("file", "Выберите файл аватара.");
            return ValidationProblem(ModelState);
        }

        string url;
        try
        {
            url = await _avatarStorage.SaveAsync(file, cancellationToken);
        }
        catch (AvatarValidationException exception)
        {
            ModelState.AddModelError("file", exception.Message);
            return ValidationProblem(ModelState);
        }

        _avatarStorage.Delete(user.AvatarUrl);
        user.AvatarUrl = url;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            _avatarStorage.Delete(url);
            return ValidationProblemResult(result);
        }

        return Ok(ToResponse(user));
    }

    [Authorize]
    [HttpDelete("avatar")]
    public async Task<IActionResult> DeleteAvatar()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return UnauthorizedProblem("Сессия не найдена. Войдите снова.");
        }

        _avatarStorage.Delete(user.AvatarUrl);
        user.AvatarUrl = null;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return ValidationProblemResult(result);
        }

        return Ok(ToResponse(user));
    }

    private static CurrentUserResponse ToResponse(ApplicationUser user) =>
        new(user.Id, user.DisplayName, user.Email ?? string.Empty, user.AvatarUrl);

    private IActionResult ConflictProblem(string detail) =>
        Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Конфликт учётной записи.",
            detail: detail);

    private IActionResult UnauthorizedProblem(string detail) =>
        Problem(
            statusCode: StatusCodes.Status401Unauthorized,
            title: "Требуется вход.",
            detail: detail);

    private IActionResult ValidationProblemResult(IdentityResult result)
    {
        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }

        return ValidationProblem(ModelState);
    }
}
