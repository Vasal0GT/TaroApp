using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IExternalAuthTokenValidator
    {
        Task<ExternalAuthUserInfo> ValidateAsync(string provider, string identityToken, CancellationToken cancellationToken = default);
    }
}
