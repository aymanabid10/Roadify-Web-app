namespace backend.Models;

public class EmailSettings
{
    public EmailSettings(string smtpServer, int port, string senderName, string senderEmail, string username,
        string password, bool enableSsl)
    {
        SmtpServer = smtpServer;
        Port = port;
        SenderName = senderName;
        SenderEmail = senderEmail;
        Username = username;
        Password = password;
        EnableSsl = enableSsl;
    }

    public string SmtpServer { get; set; }
    public int Port { get; set; }
    public string SenderName { get; set; }
    public string SenderEmail { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public bool EnableSsl { get; set; }
}
