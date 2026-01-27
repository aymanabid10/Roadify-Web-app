using System.ComponentModel.DataAnnotations;
using apiroot.Models;

namespace apiroot.Models;

public class Review
{
    public Guid ReviewerId { get; set; }
    public Guid TargetUserId { get; set; }
    [Range(1, 10)]
    public int Rating { get; set; }
    public string Comment { get; set; } = String.Empty;

    public DateTime CreatedAt { get; set; }

}