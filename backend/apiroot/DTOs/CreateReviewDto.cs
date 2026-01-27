public class CreateReviewDto
{
    public Guid TargetUserId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
}
