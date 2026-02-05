using apiroot.DTOs;

public interface IMessageService
{
    Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto);
    Task<PaginatedResponse<MessageDto>> GetConversationAsync(
        Guid currentUserId,
        Guid otherUserId,
        int page,
        int pageSize);
}
