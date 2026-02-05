using Microsoft.AspNetCore.Identity;

public class Message
{
    public Guid Id { get; set; }

    public string SenderId { get; set; }
    public string ReceiverId { get; set; }

    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }

    public IdentityUser Sender { get; set; }
    public IdentityUser Receiver { get; set; }
}
