using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Interfaces
{
    public interface IEmailSender
    {
        Task SendEmailVerificationCodeAsync(string email, string code, CancellationToken cancellationToken = default);
        Task SendPasswordResetCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    }   
}
