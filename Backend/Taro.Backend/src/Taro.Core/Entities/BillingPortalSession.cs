using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Entities
{
    public sealed class BillingPortalSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        // В БД храним только хэш токена, не сам токен из URL.
        public string TokenHash { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ExpiresAt { get; set; }
        // Поставим, когда сайт обменяет URL-токен на свою сессию.
        public DateTimeOffset? UsedAt { get; set; }
    }
}
