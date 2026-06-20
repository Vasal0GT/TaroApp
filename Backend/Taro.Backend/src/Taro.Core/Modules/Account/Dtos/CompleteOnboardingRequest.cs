using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Account.Dtos
{
    public sealed class CompleteOnboardingRequest
    {
        [Required(ErrorMessage = "Nickname is required.")]
        [MinLength(2, ErrorMessage = "Nickname must contain at least 2 characters.")]
        [MaxLength(32, ErrorMessage = "Nickname must contain no more than 32 characters.")]
        public string Nickname { get; init; } = string.Empty;

        [Required(ErrorMessage = "Zodiac sign is required.")]
        public string ZodiacSign { get; init; } = string.Empty;
    }
}
