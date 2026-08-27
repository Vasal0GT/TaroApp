
using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Account.Dtos;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IAccountService
    {
        Task<AuthUserDto> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<AuthUserDto> CompleteOnboardingAsync(Guid userId, CompleteOnboardingRequest request, CancellationToken cancellationToken = default);
        Task DeleteAccountAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
