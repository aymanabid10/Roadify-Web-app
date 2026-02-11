using apiroot.DTOs;

public interface IMessageService
{
    Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto);
    Task<PaginatedResponse<MessageDto>> GetConversationAsync(
        string currentUserId,
        string otherUserId,
        int page,
        int pageSize);
}
