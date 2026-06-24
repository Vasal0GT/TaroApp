using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Enums
{
    public enum PaymentOrderStatus
    {
        Created = 1,
        Pending = 2,
        Succeeded = 3,
        Canceled = 4,
        Failed = 5,
        Refunded = 6
    }
}
