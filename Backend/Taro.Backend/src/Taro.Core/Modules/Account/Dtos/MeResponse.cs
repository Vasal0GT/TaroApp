using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Account.Dtos
{
    public sealed record MeResponse(
        Guid Id,
        string Email,
        SubscriptionTier SubscriptionTier,
        DateTimeOffset? SubscriptionExpiresAt,
        int Stars
    );
}
