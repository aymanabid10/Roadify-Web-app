using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpGet("conversation/{otherUserId}")]
    public async Task<IActionResult> GetConversation(
        Guid otherUserId,
        int page = 1,
        int pageSize = 20)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await _messageService.GetConversationAsync(
            currentUserId,
            otherUserId,
            page,
            pageSize);

        return Ok(result);
    }
}
