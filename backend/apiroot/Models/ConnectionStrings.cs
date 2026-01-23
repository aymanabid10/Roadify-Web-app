namespace apiroot.Models;

public class ConnectionStrings(string defaultConnection)
{
    public string DefaultConnection { get; set; } = defaultConnection;
}
