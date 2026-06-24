using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IYooKassaClient
    {
        Task<YooKassaCreatePaymentResult> CreateRedirectPaymentAsync(YooKassaCreatePaymentRequest request, CancellationToken cancellationToken = default);
        Task<YooKassaPaymentDetails> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default);
    }
}
