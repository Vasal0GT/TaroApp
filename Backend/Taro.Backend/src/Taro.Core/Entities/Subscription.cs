using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Entities
{
    public sealed class Subscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        // Пока используем только Plus.
        public SubscriptionTier Tier { get; set; } = SubscriptionTier.Plus;

        // Например: plus_1m, plus_3m, plus_6m, plus_12m.
        public string PlanCode { get; set; } = string.Empty;

        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

        public DateTimeOffset StartsAt { get; set; }

        public DateTimeOffset ExpiresAt { get; set; }

        public int BillingCycleMonths { get; set; }

        public bool AutoRenewEnabled { get; set; } = true;

        // Дата следующей попытки автосписания.
        public DateTimeOffset? NextChargeAt { get; set; }

        // Сохранённый способ оплаты YooKassa для автопродления.
        public string? YooKassaPaymentMethodId { get; set; }

        // Сколько звёзд давать каждый месяц по этому тарифу.
        public int StarsPerMonth { get; set; }

        public DateTimeOffset? NextStarsGrantAt { get; set; }

        public DateTimeOffset? LastStarsGrantAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? CanceledAt { get; set; }

        public List<PaymentOrder> PaymentOrders { get; set; } = new();
    }
}
