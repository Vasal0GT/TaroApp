using System;
using System.Collections.Generic;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Email
{
    public sealed class SmtpEmailSender : IEmailSender
    {
        private readonly MailOptions _options;

        public SmtpEmailSender(IOptions<MailOptions> options)
        {
            _options = options.Value;
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

            using var client = new SmtpClient();

            var secureSocketOptions = _options.UseSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

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

            using var client = new SmtpClient();

            var secureSocketOptions = _options.UseSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

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
        }
    }
}
