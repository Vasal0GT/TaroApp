using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class ResetPasswordRequest
    {
        [Required(ErrorMessage = "Reset token is required.")]
        public string ResetToken { get; init; } = string.Empty;

        [Required(ErrorMessage = "New password is required.")]
        [MinLength(8, ErrorMessage = "Password must contain at least 8 characters.")]
        public string NewPassword { get; init; } = string.Empty;
    }
}
