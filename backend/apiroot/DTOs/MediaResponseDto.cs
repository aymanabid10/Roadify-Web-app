namespace apiroot.DTOs;

public class MediaResponseDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid VehicleId { get; set; }
}
