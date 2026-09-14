using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Interfaces
{
    public interface IEmailSender
    {
        Task SendEmailVerificationCodeAsync(string email, string code, CancellationToken cancellationToken = default);
        Task SendPasswordResetCodeAsync(string email, string code, CancellationToken cancellationToken = default);
        Task SendSubscriptionRenewalNoticeAsync(
            string email,
            decimal amount,
            DateTimeOffset scheduledChargeAt,
            int billingCycleMonths,
            CancellationToken cancellationToken = default);
    }   
}
