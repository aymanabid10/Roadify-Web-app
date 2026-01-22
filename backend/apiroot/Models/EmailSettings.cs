namespace apiroot.Models;

public class EmailSettings(
    string smtpServer,
    int port,
    string senderName,
    string senderEmail,
    string username,
    string password,
    bool enableSsl)
{
    public string SmtpServer { get; set; } = smtpServer;
    public int Port { get; set; } = port;
    public string SenderName { get; set; } = senderName;
    public string SenderEmail { get; set; } = senderEmail;
    public string Username { get; set; } = username;
    public string Password { get; set; } = password;
    public bool EnableSsl { get; set; } = enableSsl;
}