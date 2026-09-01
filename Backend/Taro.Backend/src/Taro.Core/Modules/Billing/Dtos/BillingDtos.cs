using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Billing.Dtos
{
    public sealed record BillingAccountDto(SubscriptionTier SubscriptionTier, DateTimeOffset? SubscriptionExpiresAt, int StarsBalance, BillingSubscriptionDto? Subscription);
    public sealed record BillingPortalAccountDto(
        Guid UserId,
        string Email,
        string? Nickname,
        SubscriptionTier SubscriptionTier,
        DateTimeOffset? SubscriptionExpiresAt,
        int StarsBalance,
        BillingSubscriptionDto? Subscription);

    public sealed record BillingSubscriptionDto(
        Guid Id,
        string PlanCode,
        SubscriptionTier Tier,
        SubscriptionStatus Status,
        DateTimeOffset StartsAt,
        DateTimeOffset ExpiresAt,
        bool AutoRenewEnabled,
        DateTimeOffset? NextChargeAt,
        int StarsPerMonth,
        DateTimeOffset? NextStarsGrantAt);

    public sealed class SetAutoRenewRequest
    {
        public bool Enabled { get; init; }
    }

    // Только для Development.
    // Число звёзд пока задаём вручную для теста.
    public sealed class ActivatePlusForDevelopmentRequest
    {
        public int StarsPerMonth { get; init; }
    }

    // Только для Development.
    public sealed class GrantStarsForDevelopmentRequest
    {
        public int Stars { get; init; }
    }
    public sealed record CreateBillingPortalSessionResult(string Token, DateTimeOffset ExpiresAt);
    public sealed record CreateBillingPortalLinkResponse(string Url, DateTimeOffset ExpiresAt);

    public sealed class ExchangeBillingPortalLinkRequest
    {
        public string Token { get; init; } = string.Empty;
    }
    public sealed record ExchangeBillingPortalLinkResponse(string PortalAccessToken, DateTimeOffset ExpiresAt);

    public sealed class CreatePortalCheckoutRequest
    {
        public string? PlanCode { get; init; }
        public string? StarPackCode { get; init; }
        public bool AutoRenewEnabled { get; init; }
    }
}
