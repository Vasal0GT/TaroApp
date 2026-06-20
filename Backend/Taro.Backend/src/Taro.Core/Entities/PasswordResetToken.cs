using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Entities
{
    public sealed class PasswordResetToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string TokenHash { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ExpiresAt { get; set; }
        public DateTimeOffset? UsedAt { get; set; }
    }
}
