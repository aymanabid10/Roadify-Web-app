using apiroot.Models;

public class Message
{
    public Guid Id { get; set; }

    public string SenderId { get; set; }
    public string ReceiverId { get; set; }

    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }

    public ApplicationUser Sender { get; set; } = null!;
    public ApplicationUser Receiver { get; set; } = null!;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

}
