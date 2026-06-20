using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed record AuthUserDto(
        Guid Id,
        string Email,
        string? Nickname,
        string? ZodiacSign,
        SubscriptionTier SubscriptionTier,
        DateTimeOffset? SubscriptionExpiresAt,
        int Stars,
        bool IsEmailVerified,
        bool IsOnboardingCompleted);
}
