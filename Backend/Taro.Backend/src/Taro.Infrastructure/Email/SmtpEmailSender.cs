using System;
using System.Collections.Generic;
using System.Text;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Taro.Core.Interfaces;
using System.Globalization;

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

        public async Task SendSubscriptionRenewalNoticeAsync(
            string email,
            decimal amount,
            DateTimeOffset scheduledChargeAt,
            int billingCycleMonths,
            CancellationToken cancellationToken = default)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = "Предстоящее продление подписки «Таро Путь»";

            var amountText = amount.ToString("0.00", CultureInfo.GetCultureInfo("ru-RU"));
            var dateText = scheduledChargeAt.ToUniversalTime().ToString(
                "dd.MM.yyyy 'в' HH:mm 'UTC'",
                CultureInfo.GetCultureInfo("ru-RU"));
            var periodText = billingCycleMonths == 1
                ? "1 месяц"
                : $"{billingCycleMonths} мес.";
            var managementUrl = _options.SubscriptionManagementUrl;

            message.Body = new BodyBuilder
            {
                TextBody = $"""
                    Не ранее {dateText} будет выполнено автоматическое списание {amountText} ₽ за продление подписки «Таро Путь» на {periodText}.

                    Чтобы отказаться от продления и прекратить будущие списания, отключите автопродление до указанной даты:
                    {managementUrl}

                    После отключения доступ сохранится до конца уже оплаченного периода, а сохранённый способ оплаты больше не будет использоваться для повторных списаний.
                    """,
                HtmlBody = $"""
                    <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #241f2b;">
                        <h2>Предстоящее продление подписки</h2>
                        <p>Не ранее <strong>{dateText}</strong> будет выполнено автоматическое списание <strong>{amountText} ₽</strong> за продление подписки «Таро Путь» на {periodText}.</p>
                        <p>Чтобы отказаться от продления и прекратить будущие списания, отключите автопродление до указанной даты.</p>
                        <p><a href="{managementUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#6b4eff;color:#fff;text-decoration:none;">Управлять подпиской</a></p>
                        <p>После отключения доступ сохранится до конца уже оплаченного периода, а сохранённый способ оплаты больше не будет использоваться для повторных списаний.</p>
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
