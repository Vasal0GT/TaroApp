using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Entities
{
    public sealed class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = string.Empty;
        public string NormalizedEmail { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTimeOffset? EmailVerifiedAt { get; set; }
        public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;
        public DateTimeOffset? SubscriptionExpiresAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? DeletedAt { get; set; }
        public Wallet? Wallet { get; set; }
        public List<UserSession> Sessions { get; set; } = new();
        public List<EmailVerificationCode> EmailVerificationCodes { get; set; } = new();
        public List<PasswordResetCode> PasswordResetCodes { get; set; } = new();
        public List<PasswordResetToken> PasswordResetTokens { get; set; } = new();
        public string? Nickname { get; set; }
        public string? ZodiacSign { get; set; }
        public bool IsOnboardingCompleted { get; set; }
        public List<ExternalAuthAccount> ExternalAuthAccounts { get; set; } = new();
        public List<PaymentOrder> PaymentOrders { get; set; } = new();
        public List<Subscription> Subscriptions { get; set; } = new();
        public List<WalletTransaction> WalletTransactions { get; set; } = new();
        public List<BillingPortalSession> BillingPortalSessions { get; set; } = new();
    }
}
