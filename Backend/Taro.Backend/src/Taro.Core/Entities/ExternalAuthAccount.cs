using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Entities
{
    public sealed class ExternalAuthAccount
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string Provider { get; set; } = string.Empty;
        public string ProviderUserId { get; set; } = string.Empty;

        public string? Email { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}
