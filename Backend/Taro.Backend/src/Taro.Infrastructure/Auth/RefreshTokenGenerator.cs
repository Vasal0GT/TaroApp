using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Auth
{
    public sealed class RefreshTokenGenerator : IRefreshTokenGenerator
    {
        public string Generate()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);

            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }
    }
}
