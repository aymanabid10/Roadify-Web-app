using System.Diagnostics.CodeAnalysis;

namespace apiroot.Data.Mongo.Configuration;
public class MongoDbSettings
{
    public string ConnectionString { get; set; } = null!;
    public string DatabaseName { get; set; } = null!;
}
