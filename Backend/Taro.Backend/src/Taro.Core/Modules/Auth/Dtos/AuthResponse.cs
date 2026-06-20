using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed record AuthResponse(
        string AccessToken,
        string RefreshToken,
        AuthUserDto User
    );
}
