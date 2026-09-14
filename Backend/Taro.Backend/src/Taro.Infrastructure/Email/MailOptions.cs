using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Infrastructure.Email
{
    public sealed class MailOptions
    {
        public string Host { get; set; } = string.Empty;

        public int Port { get; set; } = 1025;

        public bool UseSsl { get; set; }

        public string Username { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string FromEmail { get; set; } = "no-reply@taro.local";

        public string FromName { get; set; } = "Taro";

        public string SubscriptionManagementUrl { get; set; } =
            "https://pay.taro-path-app.online/login?next=/account";
    }
}
