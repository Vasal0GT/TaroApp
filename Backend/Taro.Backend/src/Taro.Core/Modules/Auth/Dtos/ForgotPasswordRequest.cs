using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Email format is invalid.")]
        public string Email { get; init; } = string.Empty;
    }
}
