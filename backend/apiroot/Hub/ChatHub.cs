using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;

    public ChatHub(IMessageService messageService)
    {
        _messageService = messageService;
    }

    public async Task SendMessage(SendMessageDto dto)
    {
        var senderId = Context.UserIdentifier!;

        var message = await _messageService.SendMessageAsync(senderId, dto);

        await Clients.Users(
            senderId.ToString(),
            dto.ReceiverId.ToString()
        ).SendAsync("ReceiveMessage", message);
    }
}
