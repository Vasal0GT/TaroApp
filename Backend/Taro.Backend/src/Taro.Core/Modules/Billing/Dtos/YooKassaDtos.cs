using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Billing.Dtos
{
        public sealed record YooKassaCreatePaymentRequest(
            Guid PaymentOrderId,
            decimal Amount,
            string Currency,
            string Description,
            string IdempotenceKey,
            bool SavePaymentMethod);

        public sealed record YooKassaCreatePaymentResult(
            string PaymentId,
            string Status,
            bool Paid,
            string? ConfirmationUrl,
            string RawJson);

        public sealed record CreateCheckoutResponse(
            Guid OrderId,
            PaymentOrderStatus Status,
            decimal Amount,
            string Currency,
            string ConfirmationUrl);

        public sealed record YooKassaPaymentDetails(
            string PaymentId,
            string Status,
            bool Paid,
            decimal Amount,
            string Currency,
            string? PaymentMethodId,
            bool PaymentMethodSaved,
            string? MetadataPaymentOrderId,
            string RawJson);

        public sealed class YooKassaWebhookNotification
        {
            public string Type { get; init; } = string.Empty;
            public string Event { get; init; } = string.Empty;
            public YooKassaWebhookPayment Object { get; init; } = new();
        }

        public sealed class YooKassaWebhookPayment
        {
            public string Id { get; init; } = string.Empty;
        }
}
