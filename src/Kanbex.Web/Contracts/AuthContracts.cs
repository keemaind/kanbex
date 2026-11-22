using System.ComponentModel.DataAnnotations;

namespace Kanbex.Web.Contracts;

/// <summary>Данные регистрации из React-формы.</summary>
public sealed record RegisterRequest(
    [Required(ErrorMessage = "Укажите имя.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Имя должно содержать от 2 до 100 символов.")]
    string DisplayName,
    [Required(ErrorMessage = "Укажите e-mail.")]
    [EmailAddress(ErrorMessage = "Укажите корректный e-mail.")]
    string Email,
    [Required(ErrorMessage = "Укажите пароль.")]
    [MinLength(6, ErrorMessage = "Пароль должен содержать минимум 6 символов.")]
    string Password);

/// <summary>Данные входа из React-формы.</summary>
public sealed record LoginRequest(
    [Required(ErrorMessage = "Укажите e-mail.")]
    [EmailAddress(ErrorMessage = "Укажите корректный e-mail.")]
    string Email,
    [Required(ErrorMessage = "Укажите пароль.")]
    string Password);

/// <summary>Новое отображаемое имя из формы профиля.</summary>
public sealed record UpdateDisplayNameRequest(
    [Required(ErrorMessage = "Укажите имя.")]
    string DisplayName);

/// <summary>Смена пароля из формы профиля.</summary>
public sealed record ChangePasswordRequest(
    [Required(ErrorMessage = "Укажите текущий пароль.")]
    string CurrentPassword,
    [Required(ErrorMessage = "Укажите новый пароль.")]
    string NewPassword);

/// <summary>
/// Безопасный DTO текущего пользователя. Не содержит хэшей и служебных
/// полей Identity; совпадает с `CurrentUser` в клиентских типах.
/// </summary>
public sealed record CurrentUserResponse(string Id, string DisplayName, string Email);
