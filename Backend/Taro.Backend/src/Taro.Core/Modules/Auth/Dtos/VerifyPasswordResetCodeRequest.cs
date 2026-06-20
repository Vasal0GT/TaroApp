using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class VerifyPasswordResetCodeRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Email format is invalid.")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Code is required.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Code must contain 6 digits.")]
        public string Code { get; init; } = string.Empty;
    }
}
