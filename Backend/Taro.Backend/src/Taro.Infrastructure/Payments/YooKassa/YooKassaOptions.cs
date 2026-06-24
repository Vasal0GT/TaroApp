using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Infrastructure.Payments.YooKassa
{
    public sealed class YooKassaOptions
    {
        public string ShopId { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
    }
}
