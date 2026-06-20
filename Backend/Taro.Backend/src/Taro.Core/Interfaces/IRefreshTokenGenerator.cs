using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Interfaces
{
    public interface IRefreshTokenGenerator
    {
        string Generate();
    }
}
