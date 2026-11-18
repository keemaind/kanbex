using Kanbex.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Kanbex.Web.Data;

/// <summary>
/// Наполняет базу данными, без которых приложение не может работать:
/// глобальные роли Identity и (только в Development) демонстрационную учётную запись.
/// Метод идемпотентен: повторный запуск не создаёт дубликаты.
/// </summary>
public static class DatabaseSeeder
{
    public const string DemoUserEmail = "student@kanbex.local";
    public const string DemoUserPassword = "Student1";
    public const string DemoUserDisplayName = "Студент Kanbex";

    public static async Task SeedAsync(
        IServiceProvider services,
        bool seedDemoUser,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in new[] { IdentityRoleNames.Administrator, IdentityRoleNames.User })
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole(roleName));
            if (!result.Succeeded)
            {
                logger.LogError(
                    "Не удалось создать роль {Role}: {Errors}",
                    roleName,
                    string.Join("; ", result.Errors.Select(error => error.Description)));
                continue;
            }

            logger.LogInformation("Создана роль Identity: {Role}", roleName);
        }

        if (!seedDemoUser)
        {
            return;
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var demoUser = await userManager.FindByEmailAsync(DemoUserEmail);
        if (demoUser is not null)
        {
            return;
        }

        demoUser = new ApplicationUser
        {
            UserName = DemoUserEmail,
            Email = DemoUserEmail,
            EmailConfirmed = true,
            DisplayName = DemoUserDisplayName,
        };

        var createResult = await userManager.CreateAsync(demoUser, DemoUserPassword);
        if (!createResult.Succeeded)
        {
            logger.LogError(
                "Не удалось создать демонстрационного пользователя: {Errors}",
                string.Join("; ", createResult.Errors.Select(error => error.Description)));
            return;
        }

        await userManager.AddToRoleAsync(demoUser, IdentityRoleNames.User);
        logger.LogInformation(
            "Создан демонстрационный пользователь {Email} с ролью {Role}.",
            DemoUserEmail,
            IdentityRoleNames.User);
    }
}
