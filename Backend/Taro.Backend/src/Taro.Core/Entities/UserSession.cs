using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Entities
{
    public sealed class UserSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        public string RefreshTokenHash { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset ExpiresAt { get; set; }

        public DateTimeOffset? RevokedAt { get; set; }
    }
}
