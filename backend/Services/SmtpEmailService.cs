using backend.Interfaces;

namespace backend.Services;

using System.Net;
using System.Net.Mail;
using Models;
using Microsoft.Extensions.Options;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public SmtpEmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        var message = new MailMessage
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