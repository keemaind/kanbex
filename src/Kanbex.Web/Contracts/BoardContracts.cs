using System.ComponentModel.DataAnnotations;
using Kanbex.Infrastructure.Domain.Enums;

namespace Kanbex.Web.Contracts;

public sealed record BoardSummaryResponse(
    Guid Id,
    string Title,
    string Description,
    int TaskCount,
    int ColumnCount);

public sealed record BoardResponse(
    Guid Id,
    string Title,
    string Description,
    int Version,
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
    int Order);

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
    [Range(0, int.MaxValue)] int Order);
