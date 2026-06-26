using System;
using System.Collections.Generic;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Email
{
    public sealed class SmtpEmailSender : IEmailSender
    {
        private readonly MailOptions _options;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(
            IOptions<MailOptions> options,
            ILogger<SmtpEmailSender> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task SendEmailVerificationCodeAsync(
            string email,
            string code,
            CancellationToken cancellationToken = default)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _options.FromName,
                _options.FromEmail));

            message.To.Add(MailboxAddress.Parse(email));

            message.Subject = "Your Taro verification code";

            message.Body = new BodyBuilder
            {
                TextBody = $"Your Taro verification code is: {code}",
                HtmlBody = $"""
                    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                        <h2>Your Taro verification code</h2>
                        <p>Use this code to confirm your email:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">
                            {code}
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                    </div>
                    """
            }.ToMessageBody();

            await SendAsync(message, cancellationToken);
        }
        public async Task SendPasswordResetCodeAsync(
    string email,
    string code,
    CancellationToken cancellationToken = default)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _options.FromName,
                _options.FromEmail));

            message.To.Add(MailboxAddress.Parse(email));

            message.Subject = "Your Taro password reset code";

            message.Body = new BodyBuilder
            {
                TextBody = $"Your Taro password reset code is: {code}",
                HtmlBody = $"""
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Password reset code</h2>
                <p>Use this code to reset your Taro password:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">
                    {code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
            """
            }.ToMessageBody();

            await SendAsync(message, cancellationToken);
        }

        private async Task SendAsync(MimeMessage message, CancellationToken cancellationToken)
        {
            ValidateOptions();

            using var client = new SmtpClient();
            var secureSocketOptions = ResolveSecureSocketOptions();

            try
            {
                await client.ConnectAsync(
                    _options.Host,
                    _options.Port,
                    secureSocketOptions,
                    cancellationToken);

                if (!string.IsNullOrWhiteSpace(_options.Username))
                {
                    await client.AuthenticateAsync(
                        _options.Username,
                        _options.Password,
                        cancellationToken);
                }

                await client.SendAsync(message, cancellationToken);

                await client.DisconnectAsync(true, cancellationToken);

                _logger.LogInformation(
                    "Email sent via SMTP host {Host}:{Port} to {Recipient}.",
                    _options.Host,
                    _options.Port,
                    message.To.ToString());
            }
            catch (Exception error) when (error is not OperationCanceledException)
            {
                _logger.LogError(
                    error,
                    "Could not send email via SMTP host {Host}:{Port} to {Recipient}.",
                    _options.Host,
                    _options.Port,
                    message.To.ToString());

                throw;
            }
        }

        private SecureSocketOptions ResolveSecureSocketOptions()
        {
            if (!_options.UseSsl)
            {
                return SecureSocketOptions.None;
            }

            return _options.Port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;
        }

        private void ValidateOptions()
        {
            if (string.IsNullOrWhiteSpace(_options.Host))
            {
                throw new InvalidOperationException("Mail host is not configured.");
            }

            if (string.IsNullOrWhiteSpace(_options.FromEmail))
            {
                throw new InvalidOperationException("Mail FromEmail is not configured.");
            }

            if (!string.IsNullOrWhiteSpace(_options.Username) &&
                string.IsNullOrWhiteSpace(_options.Password))
            {
                throw new InvalidOperationException("Mail password is not configured.");
            }
        }
    }
}
