using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class ExternalLoginRequest
    {
        [Required(ErrorMessage = "Provider is required.")]
        public string Provider { get; init; } = string.Empty;

        [Required(ErrorMessage = "Identity token is required.")]
        public string IdentityToken { get; init; } = string.Empty;
    }
}
