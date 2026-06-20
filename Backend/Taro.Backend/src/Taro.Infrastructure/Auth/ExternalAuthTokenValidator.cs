using System.IdentityModel.Tokens.Jwt;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Taro.Core.Common;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Infrastructure.Auth
{
    public sealed class ExternalAuthTokenValidator : IExternalAuthTokenValidator
    {
        private const string AppleIssuer = "https://appleid.apple.com";

        private readonly ExternalAuthOptions _options;

        private readonly ConfigurationManager<OpenIdConnectConfiguration>
            _appleConfigurationManager;

        public ExternalAuthTokenValidator(IOptions<ExternalAuthOptions> options)
        {
            _options = options.Value;

            _appleConfigurationManager =
                new ConfigurationManager<OpenIdConnectConfiguration>(
                    "https://appleid.apple.com/.well-known/openid-configuration",
                    new OpenIdConnectConfigurationRetriever(),
                    new HttpDocumentRetriever
                    {
                        RequireHttps = true
                    });
        }

        public async Task<ExternalAuthUserInfo> ValidateAsync(
            string provider,
            string identityToken,
            CancellationToken cancellationToken = default)
        {
            var normalizedProvider = provider.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(identityToken))
                throw new AppException("Identity token is required.", 400);

            return normalizedProvider switch
            {
                "google" => await ValidateGoogleAsync(identityToken),
                "apple" => await ValidateAppleAsync(identityToken, cancellationToken),
                _ => throw new AppException("Unsupported external auth provider.", 400)
            };
        }

        private async Task<ExternalAuthUserInfo> ValidateGoogleAsync(
            string identityToken)
        {
            if (_options.GoogleAudiences.Length == 0)
                throw new AppException("Google auth is not configured.", 500);

            GoogleJsonWebSignature.Payload payload;

            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    identityToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = _options.GoogleAudiences
                    });
            }
            catch
            {
                throw new AppException("Invalid Google token.", 401);
            }

            if (string.IsNullOrWhiteSpace(payload.Subject))
                throw new AppException("Invalid Google token subject.", 401);

            if (string.IsNullOrWhiteSpace(payload.Email))
                throw new AppException("Google account email is missing.", 400);

            if (!payload.EmailVerified)
                throw new AppException("Google email is not verified.", 403);

            return new ExternalAuthUserInfo(
                "google",
                payload.Subject,
                payload.Email,
                payload.EmailVerified);
        }

        private async Task<ExternalAuthUserInfo> ValidateAppleAsync(
            string identityToken,
            CancellationToken cancellationToken)
        {
            if (_options.AppleAudiences.Length == 0)
                throw new AppException("Apple auth is not configured.", 500);

            var configuration = await _appleConfigurationManager
                .GetConfigurationAsync(cancellationToken);

            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                var principal = tokenHandler.ValidateToken(
                    identityToken,
                    new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = AppleIssuer,

                        ValidateAudience = true,
                        ValidAudiences = _options.AppleAudiences,

                        ValidateIssuerSigningKey = true,
                        IssuerSigningKeys = configuration.SigningKeys,

                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(5)
                    },
                    out _);

                var subject =
                    principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                    ?? principal.FindFirst("sub")?.Value;

                if (string.IsNullOrWhiteSpace(subject))
                    throw new AppException("Invalid Apple token subject.", 401);

                var email =
                    principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                    ?? principal.FindFirst("email")?.Value;

                var emailVerifiedRaw =
                    principal.FindFirst("email_verified")?.Value;

                var emailVerified =
                    string.IsNullOrWhiteSpace(emailVerifiedRaw) ||
                    string.Equals(
                        emailVerifiedRaw,
                        "true",
                        StringComparison.OrdinalIgnoreCase);

                return new ExternalAuthUserInfo(
                    "apple",
                    subject,
                    email,
                    emailVerified);
            }
            catch (AppException)
            {
                throw;
            }
            catch
            {
                throw new AppException("Invalid Apple token.", 401);
            }
        }
    }
}