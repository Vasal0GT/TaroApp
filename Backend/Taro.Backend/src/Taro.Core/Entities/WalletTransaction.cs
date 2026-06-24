using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Entities
{
    public sealed class WalletTransaction
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid WalletId { get; set; }

        public Wallet Wallet { get; set; } = null!;

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        // Положительное число — начисление, отрицательное — списание.
        public int Delta { get; set; }

        public int BalanceAfter { get; set; }

        public WalletTransactionReason Reason { get; set; }

        // PaymentOrder.Id, Subscription.Id, TarotReading.Id и т.д.
        public Guid? SourceId { get; set; }

        // Защита от двойного начисления при повторном webhook.
        public string IdempotencyKey { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
