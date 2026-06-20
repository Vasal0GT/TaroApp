using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed record VerifyPasswordResetCodeResponse(string ResetToken);
}
