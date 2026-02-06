using apiroot.Data;
using apiroot.DTOs;
using apiroot.Helpers;

public class MessageService : IMessageService
{
    private readonly ApplicationDbContext _context;

    public MessageService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto)
    {
        var message = new Message
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            Content = dto.Content,
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            ReceiverId = message.ReceiverId,
            Content = message.Content,
            SentAt = message.SentAt
        };
    }

    public async Task<PaginatedResponse<MessageDto>> GetConversationAsync(
        string currentUserId,
        string otherUserId,
        int page,
        int pageSize)
    {
        var query = _context.Messages
            .Where(m =>
                (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
            .OrderByDescending(m => m.SentAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                SentAt = m.SentAt
            });

        return await PaginationHelper.PaginateAsync(query, page, pageSize);
    }
}
