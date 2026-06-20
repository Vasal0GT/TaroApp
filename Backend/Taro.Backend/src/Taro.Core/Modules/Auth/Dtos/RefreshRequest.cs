using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class RefreshRequest
    {
        [Required(ErrorMessage = "Refresh token is required.")]
        public string RefreshToken { get; init; } = string.Empty;
    }
}
