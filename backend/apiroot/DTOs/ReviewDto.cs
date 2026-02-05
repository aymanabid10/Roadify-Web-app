public class ReviewDto
{    public Guid ReviewerId { get; set; }
    public int Rating { get; set; }
    public required string Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}
