public interface IMessageService
{
    Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto);
}
