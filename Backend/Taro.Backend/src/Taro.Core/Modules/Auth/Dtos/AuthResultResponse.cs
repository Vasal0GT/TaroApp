using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Auth.Dtos
{
    public sealed class AuthResultResponse
    {
        public string Type { get; init; } = string.Empty;

        public string? AccessToken { get; init; }

        public string? RefreshToken { get; init; }

        public AuthUserDto? User { get; init; }

        public string? Email { get; init; }

        public static AuthResultResponse Authenticated(AuthResponse response)
        {
            return new AuthResultResponse
            {
                Type = "authenticated",
                AccessToken = response.AccessToken,
                RefreshToken = response.RefreshToken,
                User = response.User
            };
        }

        public static AuthResultResponse EmailVerificationRequired(string email)
        {
            return new AuthResultResponse
            {
                Type = "emailVerificationRequired",
                Email = email
            };
        }
    }
}
