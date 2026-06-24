using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Enums
{
    public enum SubscriptionStatus
    {
        Active = 1,
        CancelAtPeriodEnd = 2,
        Expired = 3,
        PaymentFailed = 4,
        Canceled = 5
    }
}
