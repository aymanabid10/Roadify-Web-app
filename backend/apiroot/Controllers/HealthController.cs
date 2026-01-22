using Microsoft.AspNetCore.Mvc;

namespace apiroot.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy", dotnetVersion = System.Environment.Version.ToString() });
    }
}