using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace apiroot.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy", dotnetVersion = System.Environment.Version.ToString() });
    }
}