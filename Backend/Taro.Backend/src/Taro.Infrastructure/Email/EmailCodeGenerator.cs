using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Email
{
    public sealed class EmailCodeGenerator : IEmailCodeGenerator
    {
        public string Generate()
        {
            return RandomNumberGenerator
                .GetInt32(0, 1_000_000)
                .ToString("D6");
        }
    }
}
