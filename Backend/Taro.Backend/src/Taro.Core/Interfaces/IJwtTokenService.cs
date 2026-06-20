using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Entities;

namespace Taro.Core.Interfaces
{
    public interface IJwtTokenService
    {
        string CreateAccessToken(User user, UserSession session);
    }
}
