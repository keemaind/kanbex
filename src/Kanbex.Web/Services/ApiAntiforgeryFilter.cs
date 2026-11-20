using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kanbex.Web.Services;

/// <summary>Validates CSRF tokens for every state-changing API request.</summary>
public sealed class ApiAntiforgeryFilter(IAntiforgery antiforgery) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        if (!request.Path.StartsWithSegments("/api") ||
            request.Path.StartsWithSegments("/api/auth/antiforgery-token") ||
            HttpMethods.IsGet(request.Method) ||
            HttpMethods.IsHead(request.Method) ||
            HttpMethods.IsOptions(request.Method) ||
            HttpMethods.IsTrace(request.Method))
        {
            await next();
            return;
        }

        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Неверный antiforgery-токен.",
                Detail = "Получите новый токен через GET /api/auth/antiforgery-token и повторите запрос.",
            })
            {
                StatusCode = StatusCodes.Status400BadRequest,
            };
        }

        if (context.Result is null)
        {
            await next();
        }
    }
}
