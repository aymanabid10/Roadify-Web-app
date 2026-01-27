namespace apiroot.Data.Mongo.Documents;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public class ReviewDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRepresentation(BsonType.String)]
    public Guid ReviewerId { get; set; }

    [BsonRepresentation(BsonType.String)]
    public Guid TargetUserId { get; set; }

    public int Rating { get; set; }
    public string Comment { get; set; } = String.Empty;

    public bool IsVisible { get; set; }
    public DateTime CreatedAt { get; set; }
}
