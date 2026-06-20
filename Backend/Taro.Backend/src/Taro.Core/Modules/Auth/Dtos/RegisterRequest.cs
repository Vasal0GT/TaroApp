using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class RegisterRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Email format is invalid.")]
        public string Email { get; init; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must contain at least 8 characters.")]
        public string Password { get; init; } = string.Empty;
    }
}
