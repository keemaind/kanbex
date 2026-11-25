using System.ComponentModel.DataAnnotations;
using Kanbex.Infrastructure.Domain.Enums;

namespace Kanbex.Web.Contracts;

public sealed record BoardSummaryResponse(
    Guid Id,
    string Title,
    string Description,
    int TaskCount,
    int ColumnCount,
    DateTime UpdatedAt,
    int CompletedTaskCount,
    ProjectMemberRole Role,
    bool IsPublic);

public sealed record BoardResponse(
    Guid Id,
    string Title,
    string Description,
    int Version,
    ProjectMemberRole Role,
    bool IsPublic,
    IReadOnlyList<BoardColumnResponse> Columns);

public sealed record BoardColumnResponse(
    Guid Id,
    string Title,
    int? WipLimit,
    int Order,
    IReadOnlyList<BoardTaskResponse> Tasks);

public sealed record BoardTaskResponse(
    Guid Id,
    string Title,
    string Description,
    TaskPriority Priority,
    int Order,
    string? AssigneeId = null,
    string? AssigneeName = null,
    DateTime? DueDate = null,
    int? Estimate = null,
    IReadOnlyList<TagResponse>? Tags = null,
    int CommentCount = 0);

public sealed record CreateBoardRequest(
    [Required, StringLength(120, MinimumLength = 2)] string Title,
    [StringLength(4000)] string? Description);

public sealed record UpdateBoardRequest(
    [Required, StringLength(120, MinimumLength = 2)] string Title,
    [StringLength(4000)] string? Description,
    [Range(0, int.MaxValue)] int Version,
    [Required, MinLength(1)] IReadOnlyList<UpdateBoardColumnRequest> Columns);

public sealed record UpdateBoardColumnRequest(
    [Required] Guid Id,
    [Required, StringLength(100, MinimumLength = 1)] string Title,
    [Range(0, int.MaxValue)] int? WipLimit,
    [Range(0, int.MaxValue)] int Order,
    [Required] IReadOnlyList<UpdateBoardTaskRequest> Tasks);

public sealed record UpdateBoardTaskRequest(
    [Required] Guid Id,
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [StringLength(10000)] string? Description,
    TaskPriority Priority,
    [Range(0, int.MaxValue)] int Order,
    string? AssigneeId = null,
    DateTime? DueDate = null,
    [Range(0, 1000)] int? Estimate = null);

public sealed record UpdateVisibilityRequest(bool IsPublic);

public sealed record BoardMemberResponse(
    string UserId,
    string DisplayName,
    ProjectMemberRole Role,
    DateTime JoinedAt,
    string? AvatarUrl = null);

public sealed record AddBoardMemberRequest(
    [Required(ErrorMessage = "Укажите e-mail.")]
    [EmailAddress(ErrorMessage = "Укажите корректный e-mail.")]
    string Email);

public sealed record CommentResponse(
    Guid Id,
    Guid TaskId,
    string Content,
    string AuthorId,
    string AuthorName,
    DateTime CreatedAt);

public sealed record CreateCommentRequest(
    [Required(ErrorMessage = "Введите текст комментария.")]
    [StringLength(4000, MinimumLength = 1, ErrorMessage = "Комментарий должен содержать от 1 до 4000 символов.")]
    string Content);

public sealed record TagResponse(Guid Id, string Name, string Color);

public sealed record CreateTagRequest(
    [Required, StringLength(64, MinimumLength = 1)] string Name,
    [Required, RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Цвет задаётся в формате #RRGGBB.")] string Color);

public sealed record UpdateTagRequest(
    [Required, StringLength(64, MinimumLength = 1)] string Name,
    [Required, RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Цвет задаётся в формате #RRGGBB.")] string Color);

public sealed record UpdateTaskTagsRequest([Required] IReadOnlyList<Guid> TagIds);

public sealed record TaskHistoryResponse(
    Guid Id,
    Guid TaskId,
    TaskHistoryEventType EventType,
    string ChangedById,
    string ChangedByName,
    Guid? OldColumnId,
    Guid? NewColumnId,
    string? Details,
    DateTime ChangedAt);

public sealed record PublicBoardResponse(
    Guid Id,
    string Title,
    string Description,
    IReadOnlyList<PublicBoardColumnResponse> Columns);

public sealed record PublicBoardColumnResponse(
    Guid Id,
    string Title,
    int? WipLimit,
    int Order,
    IReadOnlyList<PublicBoardTaskResponse> Tasks);

public sealed record PublicBoardTaskResponse(
    Guid Id,
    string Title,
    string Description,
    TaskPriority Priority,
    int Order,
    string? AssigneeName,
    DateTime? DueDate,
    int? Estimate,
    IReadOnlyList<TagResponse> Tags);
