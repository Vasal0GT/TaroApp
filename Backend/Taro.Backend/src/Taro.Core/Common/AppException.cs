using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Common
{
    public sealed class AppException : Exception
    {
        public int StatusCode { get; }

        public AppException(string message, int statusCode = 400)
            : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
