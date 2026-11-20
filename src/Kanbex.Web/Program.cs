using Kanbex.Infrastructure.Identity;
using Kanbex.Infrastructure.Persistence;
using Kanbex.Web.Data;
using Kanbex.Web.Services;
using Kanbex.Infrastructure.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using ViteDotNet;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Kanbex")
    ?? throw new InvalidOperationException(
        "Строка подключения 'Kanbex' не задана. Добавьте ConnectionStrings:Kanbex в appsettings.json.");

// EF Core использует SQLite; файл базы лежит вне исходного контроля версий.
builder.Services.AddDbContext<KanbexDbContext>(options => options.UseSqlite(connectionString));

// Identity хранит пользователей и роли в той же базе через EF Core и выдаёт
// same-origin cookie-сессию для MVC-хостов и API.
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<KanbexDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "Kanbex.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.LoginPath = "/login";
    options.LogoutPath = "/api/auth/logout";
    options.AccessDeniedPath = "/boards";
    options.SlidingExpiration = true;

    // Клиентские маршруты React обрабатывает сам, а API должен отвечать
    // кодами 401/403 вместо HTML-редиректа на страницу входа.
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "Kanbex.Antiforgery";
});

builder.Services.AddScoped<BoardService>();
builder.Services.AddScoped<ApiAntiforgeryFilter>();
builder.Services.AddControllersWithViews(options => options.Filters.AddService<ApiAntiforgeryFilter>())
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddAuthorization();
builder.Services.AddViteIntegration(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Для учебной среды допустимо автоматически применять миграции при старте.
// В production схема обновляется контролируемо через dotnet ef.
if (app.Environment.IsDevelopment())
{
    await PrepareDatabaseAsync(app);
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Middleware antiforgery нужен API-запросам, изменяющим состояние (POST/PUT/DELETE).
app.UseAntiforgery();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

// Последний маршрут: неизвестный URL без расширения отдаёт Razor-хост SPA,
// чтобы прямые ссылки на клиентские страницы не превращались в серверный 404.
app.MapFallbackToController("SpaFallback", "Home");


app.Run();

static async Task PrepareDatabaseAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<KanbexDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    await dbContext.Database.MigrateAsync();
    logger.LogInformation("Миграции Kanbex применены: {Database}", dbContext.Database.GetDbConnection().Database);

    await DatabaseSeeder.SeedAsync(
        scope.ServiceProvider,
        seedDemoUser: app.Configuration.GetValue("SeedDemoUser", true),
        logger);
}

// Нужен интеграционным тестам: WebApplicationFactory<Program> находит хост
// по точке входа приложения.
public partial class Program;
