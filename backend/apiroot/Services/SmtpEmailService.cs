using apiroot.Interfaces;

namespace apiroot.Services;

using System.Net;
using System.Net.Mail;
using Models;
using Microsoft.Extensions.Options;

public class SmtpEmailService(IOptions<EmailSettings> settings) : IEmailService
{
    private readonly EmailSettings _settings = settings.Value;

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var client = new SmtpClient(_settings.SmtpServer, _settings.Port);
        client.Credentials = new NetworkCredential(
            _settings.Username,
            _settings.Password);
        client.EnableSsl = _settings.EnableSsl;

        await client.SendMailAsync(message, cancellationToken);
    }
}