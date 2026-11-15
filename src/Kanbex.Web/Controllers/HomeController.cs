using Microsoft.AspNetCore.Mvc;

namespace Kanbex.Web.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => View();
}
