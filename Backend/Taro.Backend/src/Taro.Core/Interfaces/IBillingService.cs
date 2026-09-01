using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IBillingService
    {
        Task<BillingAccountDto> GetAccountAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<BillingPortalAccountDto> GetPortalAccountAsync(Guid userId, CancellationToken cancellationToken = default);
        // Временный метод: имитирует успешную оплату Plus за 449 ₽.
        Task<BillingAccountDto> ActivatePlusForDevelopmentAsync(Guid userId, int starsPerMonth, CancellationToken cancellationToken = default);
        Task<BillingAccountDto> SetAutoRenewAsync(Guid userId, Guid subscriptionId, bool enabled, CancellationToken cancellationToken = default);
        // Отмена = отключение будущего автопродления.
        // Доступ остаётся до ExpiresAt.
        Task<BillingAccountDto> CancelSubscriptionAsync(Guid userId, Guid subscriptionId, CancellationToken cancellationToken = default);
        // Временный метод для проверки Wallet и WalletTransaction.
        Task<BillingAccountDto> GrantStarsForDevelopmentAsync(Guid userId, int stars, CancellationToken cancellationToken = default);
        // Worker начисляет ежемесячную часть звёзд для длинных тарифов.
        Task<int> GrantDueSubscriptionStarsAsync(DateTimeOffset now, CancellationToken cancellationToken = default);

        Task<CreateCheckoutResponse> CreatePlusCheckoutAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<CreateCheckoutResponse> CreateCheckoutAsync(Guid userId, string? planCode, string? starPackCode, bool autoRenewEnabled = false, CancellationToken cancellationToken = default);
        Task ProcessYooKassaPaymentSucceededAsync(string yooKassaPaymentId, CancellationToken cancellationToken = default);
        Task ProcessYooKassaPaymentCanceledAsync(string yooKassaPaymentId, CancellationToken cancellationToken = default);
        Task<int> ReconcilePendingYooKassaPaymentsAsync(CancellationToken cancellationToken = default);
        Task<int> CreateDueSubscriptionRenewalsAsync(DateTimeOffset now, CancellationToken cancellationToken = default);
        //
        Task<CreateBillingPortalSessionResult> CreateBillingPortalSessionAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Guid> ConsumeBillingPortalSessionAsync(string token, CancellationToken cancellationToken = default);
    }
}
