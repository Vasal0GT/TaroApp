using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Infrastructure.Auth
{
    public sealed class ExternalAuthOptions
    {
        public string[] GoogleAudiences { get; set; } = Array.Empty<string>();
        public string[] AppleAudiences { get; set; } = Array.Empty<string>();
    }
}
