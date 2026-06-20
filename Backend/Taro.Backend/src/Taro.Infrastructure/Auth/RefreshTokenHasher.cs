using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Auth
{
    public sealed class RefreshTokenHasher : IRefreshTokenHasher
    {
        public string Hash(string refreshToken)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));

            return Convert.ToHexString(bytes);
        }
    }
}
