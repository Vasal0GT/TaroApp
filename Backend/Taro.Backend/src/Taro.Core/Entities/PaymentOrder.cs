using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Entities
{
    public sealed class PaymentOrder
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        public Guid? SubscriptionId { get; set; }

        public Subscription? Subscription { get; set; }

        // Например: plus_1m, plus_3m, stars_50.
        public string ProductCode { get; set; } = string.Empty;

        public PaymentOrderKind Kind { get; set; }

        public PaymentOrderStatus Status { get; set; } = PaymentOrderStatus.Created;

        // Явное согласие пользователя на сохранение способа оплаты и автопродление.
        public bool AutoRenewRequested { get; set; }

        // Версия оферты и момент её принятия фиксируются для каждого заказа.
        public string OfferVersion { get; set; } = string.Empty;

        public DateTimeOffset OfferAcceptedAt { get; set; }

        public DateTimeOffset? AutoRenewConsentAt { get; set; }

        // Для повторных списаний фиксируем период и номер попытки.
        public DateTimeOffset? RenewalPeriodEndsAt { get; set; }

        public int RenewalAttemptNumber { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "RUB";

        // Наш ключ идемпотентности для YooKassa.
        public string IdempotenceKey { get; set; } = Guid.NewGuid().ToString("N");

        public string? YooKassaPaymentId { get; set; }

        public string? ConfirmationUrl { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? PaidAt { get; set; }

        public DateTimeOffset? CanceledAt { get; set; }

        public string? FailureReason { get; set; }

        // Сырым JSON сохраняем ответ YooKassa для аудита.
        public string? RawProviderPayload { get; set; }
    }
}
