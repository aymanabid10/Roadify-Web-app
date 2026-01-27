using apiroot.Data.Mongo;
using apiroot.Data.Mongo.Documents;
using MongoDB.Driver;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDbSettings:ConnectionString"];
        var databaseName = configuration["MongoDbSettings:Database"];

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new Exception("MongoDB ConnectionString is missing");

        if (string.IsNullOrWhiteSpace(databaseName))
            throw new Exception("MongoDB Database name is missing");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);

    }

    public IMongoCollection<ReviewDocument> Reviews =>
        _database.GetCollection<ReviewDocument>("reviews");
}
