using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Taro.Core.Common;
using Taro.Core.Entities;
using Taro.Core.Enums;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Core.Modules.Billing.Services
{
    public sealed class BillingService : IBillingService
    {
        private const string PlusMonthlyPlanCode = "plus_1m";
        private const decimal PlusMonthlyPrice = 449m;
        private const int PlusMonthlyStars = 150;

        private static readonly BillingPlan[] BillingPlans =
        [
            new("plus_1m", 1, 449m, PlusMonthlyStars),
            new("plus_3m", 3, 1190m, PlusMonthlyStars),
            new("plus_6m", 6, 2190m, PlusMonthlyStars),
            new("plus_12m", 12, 3990m, PlusMonthlyStars)
        ];

        private static readonly StarPack[] StarPacks =
        [
            new("stars_50", 50, 199m),
            new("stars_120", 120, 399m),
            new("stars_300", 300, 899m),
            new("stars_750", 750, 1990m)
        ];

        private readonly IYooKassaClient _yooKassaClient;
        private readonly IAppDbContext _db;

        public BillingService(IAppDbContext db, IYooKassaClient yooKassaClient)
        {
            _db = db;
            _yooKassaClient = yooKassaClient;
        }

        public async Task<BillingAccountDto> GetAccountAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            var wallet = await GetOrCreateWalletAsync(
                userId,
                cancellationToken);

            var subscription = await GetCurrentSubscriptionAsync(
                user,
                cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);

            return ToAccountDto(user, wallet, subscription);
        }

        public async Task<BillingPortalAccountDto> GetPortalAccountAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            var wallet = await GetOrCreateWalletAsync(
                userId,
                cancellationToken);

            var subscription = await GetCurrentSubscriptionAsync(
                user,
                cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);

            return ToPortalAccountDto(user, wallet, subscription);
        }

        public async Task<BillingAccountDto> ActivatePlusForDevelopmentAsync(Guid userId, int starsPerMonth, CancellationToken cancellationToken = default)
        {
            if (starsPerMonth < 0 || starsPerMonth > 100_000)
            {
                throw new AppException(
                    "Stars per month must be between 0 and 100000.",
                    400);
            }

            var now = DateTimeOffset.UtcNow;

            var user = await GetUserAsync(userId, cancellationToken);

            var wallet = await GetOrCreateWalletAsync(
                userId,
                cancellationToken);

            var currentSubscription = await _db.Subscriptions
                .Where(x =>
                    x.UserId == userId &&
                    (x.Status == SubscriptionStatus.Active ||
                     x.Status == SubscriptionStatus.CancelAtPeriodEnd) &&
                    x.ExpiresAt > now)
                .OrderByDescending(x => x.ExpiresAt)
                .FirstOrDefaultAsync(cancellationToken);

            var isRenewal = currentSubscription is not null;

            Subscription subscription;

            if (currentSubscription is null)
            {
                subscription = new Subscription
                {
                    UserId = userId,
                    Tier = SubscriptionTier.Plus,
                    PlanCode = PlusMonthlyPlanCode,
                    Status = SubscriptionStatus.Active,
                    StartsAt = now,
                    ExpiresAt = now.AddMonths(1),
                    BillingCycleMonths = 1,
                    AutoRenewEnabled = true,
                    NextChargeAt = now.AddMonths(1),
                    StarsPerMonth = starsPerMonth,
                    NextStarsGrantAt = starsPerMonth > 0
                        ? now.AddMonths(1)
                        : null
                };

                _db.Subscriptions.Add(subscription);
            }
            else
            {
                subscription = currentSubscription;

                subscription.Tier = SubscriptionTier.Plus;
                subscription.PlanCode = PlusMonthlyPlanCode;
                subscription.Status = SubscriptionStatus.Active;
                subscription.BillingCycleMonths = 1;
                subscription.AutoRenewEnabled = true;
                subscription.CanceledAt = null;
                subscription.StarsPerMonth = starsPerMonth;
                subscription.ExpiresAt = subscription.ExpiresAt.AddMonths(1);
                subscription.NextChargeAt = subscription.ExpiresAt;
                subscription.NextStarsGrantAt = starsPerMonth > 0
                    ? now.AddMonths(1)
                    : null;
            }

            user.SubscriptionTier = SubscriptionTier.Plus;
            user.SubscriptionExpiresAt = subscription.ExpiresAt;

            var paymentOrder = new PaymentOrder
            {
                UserId = userId,
                Subscription = subscription,
                ProductCode = PlusMonthlyPlanCode,
                Kind = isRenewal
                    ? PaymentOrderKind.SubscriptionRenewal
                    : PaymentOrderKind.SubscriptionInitial,
                Status = PaymentOrderStatus.Succeeded,
                Amount = PlusMonthlyPrice,
                Currency = "RUB",
                IdempotenceKey = $"dev-plus-{Guid.NewGuid():N}",
                PaidAt = now
            };

            _db.PaymentOrders.Add(paymentOrder);

            if (starsPerMonth > 0)
            {
                AddWalletTransaction(
                    wallet,
                    userId,
                    starsPerMonth,
                    WalletTransactionReason.SubscriptionGrant,
                    subscription.Id,
                    $"dev-subscription-initial:{subscription.Id:N}:{now:yyyyMMddHHmmssfff}",
                    now);

                subscription.LastStarsGrantAt = now;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return ToAccountDto(user, wallet, subscription);
        }

        public async Task<BillingAccountDto> SetAutoRenewAsync(Guid userId, Guid subscriptionId, bool enabled, CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            var wallet = await GetOrCreateWalletAsync(
                userId,
                cancellationToken);

            var subscription = await _db.Subscriptions
                .FirstOrDefaultAsync(
                    x => x.Id == subscriptionId && x.UserId == userId,
                    cancellationToken);

            if (subscription is null)
            {
                throw new KeyNotFoundException("Subscription not found.");
            }

            var now = DateTimeOffset.UtcNow;

            if (subscription.ExpiresAt <= now)
            {
                subscription.Status = SubscriptionStatus.Expired;
                subscription.AutoRenewEnabled = false;
                subscription.NextChargeAt = null;

                if (user.SubscriptionExpiresAt is null ||
                    user.SubscriptionExpiresAt <= now)
                {
                    user.SubscriptionTier = SubscriptionTier.Free;
                    user.SubscriptionExpiresAt = null;
                }

                await _db.SaveChangesAsync(cancellationToken);

                throw new AppException(
                    "The subscription has already expired.",
                    400);
            }

            subscription.AutoRenewEnabled = enabled;

            if (enabled)
            {
                subscription.Status = SubscriptionStatus.Active;
                subscription.CanceledAt = null;
                subscription.NextChargeAt = subscription.ExpiresAt;
            }
            else
            {
                subscription.Status = SubscriptionStatus.CancelAtPeriodEnd;
                subscription.CanceledAt = now;
                subscription.NextChargeAt = null;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return ToAccountDto(user, wallet, subscription);
        }

        public Task<BillingAccountDto> CancelSubscriptionAsync(Guid userId, Guid subscriptionId, CancellationToken cancellationToken = default)
        {
            return SetAutoRenewAsync(
                userId,
                subscriptionId,
                false,
                cancellationToken);
        }

        public async Task<BillingAccountDto> GrantStarsForDevelopmentAsync(Guid userId, int stars, CancellationToken cancellationToken = default)
        {
            if (stars <= 0 || stars > 100_000)
            {
                throw new AppException(
                    "Stars must be between 1 and 100000.",
                    400);
            }

            var now = DateTimeOffset.UtcNow;

            var user = await GetUserAsync(userId, cancellationToken);

            var wallet = await GetOrCreateWalletAsync(
                userId,
                cancellationToken);

            var subscription = await GetCurrentSubscriptionAsync(
                user,
                cancellationToken);

            AddWalletTransaction(
                wallet,
                userId,
                stars,
                WalletTransactionReason.AdminAdjustment,
                null,
                $"dev-stars-{Guid.NewGuid():N}",
                now);

            await _db.SaveChangesAsync(cancellationToken);

            return ToAccountDto(user, wallet, subscription);
        }

        public async Task<int> GrantDueSubscriptionStarsAsync(DateTimeOffset now, CancellationToken cancellationToken = default)
        {
            var subscriptions = await _db.Subscriptions
                .Where(x =>
                    (x.Status == SubscriptionStatus.Active ||
                     x.Status == SubscriptionStatus.CancelAtPeriodEnd) &&
                    x.ExpiresAt > now &&
                    x.StarsPerMonth > 0 &&
                    x.NextStarsGrantAt != null &&
                    x.NextStarsGrantAt <= now)
                .ToListAsync(cancellationToken);

            var grantedCount = 0;
            var hasChanges = false;

            foreach (var subscription in subscriptions)
            {
                var wallet = await GetOrCreateWalletAsync(
                    subscription.UserId,
                    cancellationToken);

                while (subscription.NextStarsGrantAt is not null &&
                       subscription.NextStarsGrantAt <= now &&
                       subscription.NextStarsGrantAt < subscription.ExpiresAt)
                {
                    var grantAt = subscription.NextStarsGrantAt.Value;

                    var idempotencyKey =
                        $"subscription-monthly:{subscription.Id:N}:{grantAt:yyyyMMddHHmmss}";

                    var alreadyGranted = await _db.WalletTransactions
                        .AnyAsync(
                            x => x.IdempotencyKey == idempotencyKey,
                            cancellationToken);

                    if (!alreadyGranted)
                    {
                        AddWalletTransaction(
                            wallet,
                            subscription.UserId,
                            subscription.StarsPerMonth,
                            WalletTransactionReason.SubscriptionGrant,
                            subscription.Id,
                            idempotencyKey,
                            now);

                        grantedCount++;
                    }

                    subscription.LastStarsGrantAt = grantAt;
                    subscription.NextStarsGrantAt = grantAt.AddMonths(1);

                    hasChanges = true;
                }
            }

            if (hasChanges)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }

            return grantedCount;
        }

        private async Task<User> GetUserAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.Id == userId && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return user;
        }

        private async Task<Wallet> GetOrCreateWalletAsync(Guid userId, CancellationToken cancellationToken)
        {
            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (wallet is not null)
            {
                return wallet;
            }

            wallet = new Wallet
            {
                UserId = userId,
                Balance = 0,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _db.Wallets.Add(wallet);

            return wallet;
        }

        private async Task<Subscription?> GetCurrentSubscriptionAsync(User user, CancellationToken cancellationToken)
        {
            var now = DateTimeOffset.UtcNow;

            var subscription = await _db.Subscriptions
                .Where(x =>
                    x.UserId == user.Id &&
                    (x.Status == SubscriptionStatus.Active ||
                     x.Status == SubscriptionStatus.CancelAtPeriodEnd))
                .OrderByDescending(x => x.ExpiresAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (subscription is null)
            {
                return null;
            }

            if (subscription.ExpiresAt > now)
            {
                user.SubscriptionTier = subscription.Tier;
                user.SubscriptionExpiresAt = subscription.ExpiresAt;

                return subscription;
            }

            subscription.Status = SubscriptionStatus.Expired;
            subscription.AutoRenewEnabled = false;
            subscription.NextChargeAt = null;

            if (user.SubscriptionExpiresAt is null ||
                user.SubscriptionExpiresAt <= now)
            {
                user.SubscriptionTier = SubscriptionTier.Free;
                user.SubscriptionExpiresAt = null;
            }

            return null;
        }

        private void AddWalletTransaction(
            Wallet wallet,
            Guid userId,
            int delta,
            WalletTransactionReason reason,
            Guid? sourceId,
            string idempotencyKey,
            DateTimeOffset createdAt)
        {
            wallet.Balance += delta;
            wallet.UpdatedAt = createdAt;

            _db.WalletTransactions.Add(new WalletTransaction
            {
                Wallet = wallet,
                UserId = userId,
                Delta = delta,
                BalanceAfter = wallet.Balance,
                Reason = reason,
                SourceId = sourceId,
                IdempotencyKey = idempotencyKey,
                CreatedAt = createdAt
            });
        }

        private static BillingAccountDto ToAccountDto(User user, Wallet wallet, Subscription? subscription)
        {
            return new BillingAccountDto(
                user.SubscriptionTier,
                user.SubscriptionExpiresAt,
                wallet.Balance,
                subscription is null
                    ? null
                    : new BillingSubscriptionDto(
                        subscription.Id,
                        subscription.PlanCode,
                        subscription.Tier,
                        subscription.Status,
                        subscription.StartsAt,
                        subscription.ExpiresAt,
                        subscription.AutoRenewEnabled,
                        subscription.NextChargeAt,
                        subscription.StarsPerMonth,
                        subscription.NextStarsGrantAt));
        }

        private static BillingPortalAccountDto ToPortalAccountDto(User user, Wallet wallet, Subscription? subscription)
        {
            return new BillingPortalAccountDto(
                user.Id,
                user.Email,
                user.Nickname,
                user.SubscriptionTier,
                user.SubscriptionExpiresAt,
                wallet.Balance,
                subscription is null
                    ? null
                    : new BillingSubscriptionDto(
                        subscription.Id,
                        subscription.PlanCode,
                        subscription.Tier,
                        subscription.Status,
                        subscription.StartsAt,
                        subscription.ExpiresAt,
                        subscription.AutoRenewEnabled,
                        subscription.NextChargeAt,
                        subscription.StarsPerMonth,
                        subscription.NextStarsGrantAt));
        }
        public async Task<CreateCheckoutResponse> CreatePlusCheckoutAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await CreateCheckoutAsync(
                userId,
                PlusMonthlyPlanCode,
                null,
                cancellationToken);
        }
        public async Task<CreateCheckoutResponse> CreateCheckoutAsync(
            Guid userId,
            string? planCode,
            string? starPackCode,
            CancellationToken cancellationToken = default)
        {
            var userExists = await _db.Users
                .AnyAsync(
                    x => x.Id == userId && x.DeletedAt == null,
                    cancellationToken);

            if (!userExists)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var plan = GetBillingPlanOrNull(planCode);
            var starPack = GetStarPackOrNull(starPackCode);

            if (plan is null && starPack is null)
            {
                throw new AppException(
                    "Choose a subscription or a stars pack.",
                    400);
            }

            var amount =
                (plan?.Price ?? 0m) +
                (starPack?.Price ?? 0m);

            var paymentOrder = new PaymentOrder
            {
                UserId = userId,
                ProductCode = BuildProductCode(plan, starPack),
                Kind = plan is null
                    ? PaymentOrderKind.StarsPurchase
                    : PaymentOrderKind.SubscriptionInitial,
                Status = PaymentOrderStatus.Created,
                Amount = amount,
                Currency = "RUB",
                IdempotenceKey = Guid.NewGuid().ToString("N"),
                CreatedAt = DateTimeOffset.UtcNow
            };

            _db.PaymentOrders.Add(paymentOrder);

            // Сначала фиксируем заказ у себя.
            await _db.SaveChangesAsync(cancellationToken);

            try
            {
                var yooKassaPayment = await _yooKassaClient
                    .CreateRedirectPaymentAsync(
                        new YooKassaCreatePaymentRequest(
                            paymentOrder.Id,
                            paymentOrder.Amount,
                            paymentOrder.Currency,
                            BuildPaymentDescription(plan, starPack),
                            paymentOrder.IdempotenceKey,
                            SavePaymentMethod: plan is not null),
                        cancellationToken);

                paymentOrder.YooKassaPaymentId = yooKassaPayment.PaymentId;
                paymentOrder.ConfirmationUrl = yooKassaPayment.ConfirmationUrl;
                paymentOrder.RawProviderPayload = yooKassaPayment.RawJson;
                paymentOrder.Status = MapYooKassaPaymentStatus(
                    yooKassaPayment.Status);

                if (paymentOrder.Status == PaymentOrderStatus.Succeeded)
                {
                    paymentOrder.PaidAt = DateTimeOffset.UtcNow;
                }

                await _db.SaveChangesAsync(cancellationToken);

                if (string.IsNullOrWhiteSpace(paymentOrder.ConfirmationUrl))
                {
                    throw new AppException(
                        "YooKassa did not return a confirmation URL.",
                        502);
                }

                return new CreateCheckoutResponse(
                    paymentOrder.Id,
                    paymentOrder.Status,
                    paymentOrder.Amount,
                    paymentOrder.Currency,
                    paymentOrder.ConfirmationUrl);
            }
            catch (Exception ex)
            {
                paymentOrder.Status = PaymentOrderStatus.Failed;
                paymentOrder.FailureReason = TruncateError(ex.Message);

                await _db.SaveChangesAsync(cancellationToken);

                throw;
            }
        }

        private static PaymentOrderStatus MapYooKassaPaymentStatus(string status)
        {
            return status.ToLowerInvariant() switch
            {
                "pending" => PaymentOrderStatus.Pending,
                "succeeded" => PaymentOrderStatus.Succeeded,
                "canceled" => PaymentOrderStatus.Canceled,
                _ => PaymentOrderStatus.Failed
            };
        }

        private static string TruncateError(string value)
        {
            const int maxLength = 2000;

            return value.Length <= maxLength
                ? value
                : value[..maxLength];
        }

        public async Task ProcessYooKassaPaymentSucceededAsync(string yooKassaPaymentId, CancellationToken cancellationToken = default)
        {
            var providerPayment = await _yooKassaClient.GetPaymentAsync(yooKassaPaymentId, cancellationToken);

            if (!providerPayment.Paid ||
                !string.Equals(
                    providerPayment.Status,
                    "succeeded",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(
                    "YooKassa payment is not succeeded.",
                    400);
            }

            var paymentOrder = await _db.PaymentOrders
                .FirstOrDefaultAsync(
                    x => x.YooKassaPaymentId == yooKassaPaymentId,
                    cancellationToken);

            if (paymentOrder is null)
            {
                throw new KeyNotFoundException(
                    "Payment order was not found.");
            }

            if (!Guid.TryParse(
                    providerPayment.MetadataPaymentOrderId,
                    out var metadataOrderId) ||
                metadataOrderId != paymentOrder.Id)
            {
                throw new AppException(
                    "YooKassa payment metadata does not match the payment order.",
                    400);
            }

            if (providerPayment.Amount != paymentOrder.Amount ||
                !string.Equals(
                    providerPayment.Currency,
                    paymentOrder.Currency,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(
                    "YooKassa payment amount does not match the payment order.",
                    400);
            }

            var product = ParsePaymentProduct(paymentOrder.ProductCode);

            var subscriptionAlreadyGranted =
                product.Plan is null ||
                await _db.WalletTransactions.AnyAsync(
                    x => x.IdempotencyKey == GetSubscriptionGrantKey(paymentOrder.Id),
                    cancellationToken);

            var starsAlreadyGranted =
                product.StarPack is null ||
                await _db.WalletTransactions.AnyAsync(
                    x => x.IdempotencyKey == GetStarsPurchaseKey(paymentOrder.Id),
                    cancellationToken);

            // Повторный webhook ничего не продлевает и не начисляет второй раз.
            if (paymentOrder.Status == PaymentOrderStatus.Succeeded &&
                subscriptionAlreadyGranted &&
                starsAlreadyGranted)
            {
                return;
            }

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.Id == paymentOrder.UserId &&
                         x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var now = DateTimeOffset.UtcNow;
            Subscription? subscription = null;

            if (product.Plan is not null)
            {
                subscription = await _db.Subscriptions
                    .Where(x =>
                        x.UserId == user.Id &&
                        (x.Status == SubscriptionStatus.Active ||
                         x.Status == SubscriptionStatus.CancelAtPeriodEnd) &&
                        x.ExpiresAt > now)
                    .OrderByDescending(x => x.ExpiresAt)
                    .FirstOrDefaultAsync(cancellationToken);

                if (!subscriptionAlreadyGranted)
                {
                    if (subscription is null)
                    {
                        subscription = new Subscription
                        {
                            UserId = user.Id,
                            Tier = SubscriptionTier.Plus,
                            PlanCode = product.Plan.Code,
                            Status = SubscriptionStatus.Active,
                            StartsAt = now,
                            ExpiresAt = now.AddMonths(product.Plan.Months),
                            BillingCycleMonths = product.Plan.Months,
                            StarsPerMonth = product.Plan.StarsPerMonth,
                            LastStarsGrantAt = now,
                            NextStarsGrantAt = now.AddMonths(1),
                            CreatedAt = now
                        };

                        _db.Subscriptions.Add(subscription);
                    }
                    else
                    {
                        subscription.Tier = SubscriptionTier.Plus;
                        subscription.PlanCode = product.Plan.Code;
                        subscription.Status = SubscriptionStatus.Active;
                        subscription.CanceledAt = null;
                        subscription.BillingCycleMonths = product.Plan.Months;
                        subscription.StarsPerMonth = product.Plan.StarsPerMonth;
                        subscription.ExpiresAt = subscription.ExpiresAt.AddMonths(product.Plan.Months);
                        subscription.LastStarsGrantAt = now;

                        if (subscription.NextStarsGrantAt is null ||
                            subscription.NextStarsGrantAt <= now)
                        {
                            subscription.NextStarsGrantAt = now.AddMonths(1);
                        }
                    }

                    if (subscription.NextStarsGrantAt >= subscription.ExpiresAt)
                    {
                        subscription.NextStarsGrantAt = null;
                    }

                    if (providerPayment.PaymentMethodSaved &&
                        !string.IsNullOrWhiteSpace(providerPayment.PaymentMethodId))
                    {
                        subscription.YooKassaPaymentMethodId =
                            providerPayment.PaymentMethodId;
                    }

                    subscription.AutoRenewEnabled =
                        !string.IsNullOrWhiteSpace(
                            subscription.YooKassaPaymentMethodId);

                    subscription.NextChargeAt = subscription.AutoRenewEnabled
                        ? subscription.ExpiresAt
                        : null;

                    user.SubscriptionTier = SubscriptionTier.Plus;
                    user.SubscriptionExpiresAt = subscription.ExpiresAt;

                    var wallet = await GetOrCreateWalletAsync(
                        user.Id,
                        cancellationToken);

                    AddWalletTransaction(
                        wallet,
                        user.Id,
                        product.Plan.StarsPerMonth,
                        WalletTransactionReason.SubscriptionGrant,
                        paymentOrder.Id,
                        GetSubscriptionGrantKey(paymentOrder.Id),
                        now);
                }
            }

            if (product.StarPack is not null && !starsAlreadyGranted)
            {
                var wallet = await GetOrCreateWalletAsync(
                    user.Id,
                    cancellationToken);

                AddWalletTransaction(
                    wallet,
                    user.Id,
                    product.StarPack.Stars,
                    WalletTransactionReason.StarsPurchase,
                    paymentOrder.Id,
                    GetStarsPurchaseKey(paymentOrder.Id),
                    now);
            }

            if (subscription is not null)
            {
                paymentOrder.Subscription = subscription;
            }

            paymentOrder.Status = PaymentOrderStatus.Succeeded;
            paymentOrder.PaidAt = now;
            paymentOrder.FailureReason = null;
            paymentOrder.RawProviderPayload = providerPayment.RawJson;

            await _db.SaveChangesAsync(cancellationToken);
        }
        public async Task ProcessYooKassaPaymentCanceledAsync(string yooKassaPaymentId, CancellationToken cancellationToken = default)
        {
            var providerPayment = await _yooKassaClient.GetPaymentAsync(
                yooKassaPaymentId,
                cancellationToken);

            if (!string.Equals(
                    providerPayment.Status,
                    "canceled",
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var paymentOrder = await _db.PaymentOrders
                .FirstOrDefaultAsync(
                    x => x.YooKassaPaymentId == yooKassaPaymentId,
                    cancellationToken);

            if (paymentOrder is null)
            {
                throw new KeyNotFoundException(
                    "Payment order was not found.");
            }

            // Никогда не откатываем уже успешно обработанную оплату.
            if (paymentOrder.Status == PaymentOrderStatus.Succeeded)
            {
                return;
            }

            // Повторный webhook ничего не меняет.
            if (paymentOrder.Status == PaymentOrderStatus.Canceled)
            {
                return;
            }

            paymentOrder.Status = PaymentOrderStatus.Canceled;
            paymentOrder.CanceledAt = DateTimeOffset.UtcNow;
            paymentOrder.FailureReason = "Payment canceled in YooKassa.";
            paymentOrder.RawProviderPayload = providerPayment.RawJson;

            await _db.SaveChangesAsync(cancellationToken);
        }
        public async Task<int> ReconcilePendingYooKassaPaymentsAsync(CancellationToken cancellationToken = default)
        {
            const int batchSize = 100;

            var oldestAllowedCreatedAt = DateTimeOffset.UtcNow.AddMinutes(-2);

            var paymentIds = await _db.PaymentOrders
                .Where(x =>
                    (x.Status == PaymentOrderStatus.Created ||
                     x.Status == PaymentOrderStatus.Pending) &&
                    x.YooKassaPaymentId != null &&
                    x.CreatedAt <= oldestAllowedCreatedAt)
                .OrderBy(x => x.CreatedAt)
                .Select(x => x.YooKassaPaymentId!)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            var finalizedCount = 0;

            foreach (var paymentId in paymentIds)
            {
                var providerPayment = await _yooKassaClient.GetPaymentAsync(
                    paymentId,
                    cancellationToken);

                if (string.Equals(
                        providerPayment.Status,
                        "succeeded",
                        StringComparison.OrdinalIgnoreCase))
                {
                    await ProcessYooKassaPaymentSucceededAsync(
                        paymentId,
                        cancellationToken);

                    finalizedCount++;
                    continue;
                }

                if (string.Equals(
                        providerPayment.Status,
                        "canceled",
                        StringComparison.OrdinalIgnoreCase))
                {
                    await ProcessYooKassaPaymentCanceledAsync(
                        paymentId,
                        cancellationToken);

                    finalizedCount++;
                }
            }

            return finalizedCount;
        }
        public async Task<CreateBillingPortalSessionResult>
        CreateBillingPortalSessionAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            await GetUserAsync(userId, cancellationToken);

            var now = DateTimeOffset.UtcNow;

            // 32 байта = 64 символа hex. Безопасно для URL.
            var rawToken = Convert.ToHexString(
                RandomNumberGenerator.GetBytes(32));

            var session = new BillingPortalSession
            {
                UserId = userId,
                TokenHash = HashPortalToken(rawToken),
                CreatedAt = now,
                ExpiresAt = now.AddMinutes(10)
            };

            _db.BillingPortalSessions.Add(session);

            await _db.SaveChangesAsync(cancellationToken);

            return new CreateBillingPortalSessionResult(
                rawToken,
                session.ExpiresAt);
        }

        public async Task<Guid> ConsumeBillingPortalSessionAsync(string token, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new AppException(
                    "Billing portal token is required.",
                    400);
            }

            var now = DateTimeOffset.UtcNow;
            var tokenHash = HashPortalToken(token);

            var session = await _db.BillingPortalSessions
                .FirstOrDefaultAsync(
                    x =>
                        x.TokenHash == tokenHash &&
                        x.UsedAt == null &&
                        x.ExpiresAt > now,
                    cancellationToken);

            if (session is null)
            {
                throw new AppException(
                    "Billing portal link is invalid, expired, or already used.",
                    401);
            }

            session.UsedAt = now;

            await _db.SaveChangesAsync(cancellationToken);

            return session.UserId;
        }

        private static string HashPortalToken(string token)
        {
            var bytes = Encoding.UTF8.GetBytes(token);

            return Convert.ToHexString(
                SHA256.HashData(bytes));
        }

        private static BillingPlan? GetBillingPlanOrNull(string? planCode)
        {
            var normalizedPlanCode = NormalizeProductCode(planCode);

            if (normalizedPlanCode is null)
            {
                return null;
            }

            var plan = BillingPlans.FirstOrDefault(
                x => x.Code == normalizedPlanCode);

            if (plan is null)
            {
                throw new AppException(
                    "Unsupported subscription plan.",
                    400);
            }

            return plan;
        }

        private static StarPack? GetStarPackOrNull(string? starPackCode)
        {
            var normalizedStarPackCode = NormalizeProductCode(starPackCode);

            if (normalizedStarPackCode is null)
            {
                return null;
            }

            var starPack = StarPacks.FirstOrDefault(
                x => x.Code == normalizedStarPackCode);

            if (starPack is null)
            {
                throw new AppException(
                    "Unsupported stars pack.",
                    400);
            }

            return starPack;
        }

        private static string? NormalizeProductCode(string? productCode)
        {
            if (string.IsNullOrWhiteSpace(productCode))
            {
                return null;
            }

            var normalized = productCode.Trim();

            return string.Equals(
                normalized,
                "none",
                StringComparison.OrdinalIgnoreCase)
                ? null
                : normalized;
        }

        private static string BuildProductCode(
            BillingPlan? plan,
            StarPack? starPack)
        {
            return string.Join(
                "+",
                new[]
                {
                    plan?.Code,
                    starPack?.Code
                }.Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        private static string BuildPaymentDescription(
            BillingPlan? plan,
            StarPack? starPack)
        {
            if (plan is not null && starPack is not null)
            {
                return
                    $"Подписка Taro Plus на {plan.Months} {GetMonthsWord(plan.Months)} и {starPack.Stars} звёзд";
            }

            if (plan is not null)
            {
                return
                    $"Подписка Taro Plus на {plan.Months} {GetMonthsWord(plan.Months)}";
            }

            if (starPack is not null)
            {
                return $"Пакет {starPack.Stars} звёзд Taro";
            }

            return "Покупка Taro";
        }

        private static PaymentProduct ParsePaymentProduct(string productCode)
        {
            BillingPlan? plan = null;
            StarPack? starPack = null;

            var parts = productCode
                .Split(
                    '+',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries);

            foreach (var part in parts)
            {
                var matchedPlan = BillingPlans.FirstOrDefault(
                    x => x.Code == part);

                if (matchedPlan is not null)
                {
                    plan = matchedPlan;
                    continue;
                }

                var matchedStarPack = StarPacks.FirstOrDefault(
                    x => x.Code == part);

                if (matchedStarPack is not null)
                {
                    starPack = matchedStarPack;
                    continue;
                }

                throw new AppException(
                    "Unsupported payment product.",
                    400);
            }

            if (plan is null && starPack is null)
            {
                throw new AppException(
                    "Unsupported payment product.",
                    400);
            }

            return new PaymentProduct(plan, starPack);
        }

        private static string GetSubscriptionGrantKey(Guid paymentOrderId)
        {
            return $"subscription-grant:{paymentOrderId:N}";
        }

        private static string GetStarsPurchaseKey(Guid paymentOrderId)
        {
            return $"stars-purchase:{paymentOrderId:N}";
        }

        private static string GetMonthsWord(int months)
        {
            return months == 1
                ? "месяц"
                : months is >= 2 and <= 4
                    ? "месяца"
                    : "месяцев";
        }

        private sealed record BillingPlan(
            string Code,
            int Months,
            decimal Price,
            int StarsPerMonth);

        private sealed record StarPack(
            string Code,
            int Stars,
            decimal Price);

        private sealed record PaymentProduct(
            BillingPlan? Plan,
            StarPack? StarPack);
    }
}
