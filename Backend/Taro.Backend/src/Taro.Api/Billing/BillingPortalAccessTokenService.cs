using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace Taro.Api.Billing
{
    public sealed class BillingPortalAccessTokenService
    {
        private readonly IDataProtector _protector;
        private readonly BillingPortalOptions _options;

        public BillingPortalAccessTokenService(IDataProtectionProvider dataProtectionProvider, IOptions<BillingPortalOptions> options)
        {
            _protector = dataProtectionProvider.CreateProtector("Taro.Api.BillingPortal.v1");
            _options = options.Value;
        }

        public BillingPortalAccessTokenResult Create(Guid userId)
        {
            var minutes = Math.Clamp(_options.AccessTokenMinutes, 5, 240);

            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(minutes);

            var payload = new BillingPortalAccessTokenPayload(userId, expiresAt);

            var rawPayload = JsonSerializer.Serialize(payload);

            var token = _protector.Protect(rawPayload);

            return new BillingPortalAccessTokenResult(token, expiresAt);
        }

        public bool TryGetUserId(string? token, out Guid userId)
        {
            userId = Guid.Empty;

            if (string.IsNullOrWhiteSpace(token))
            {
                return false;
            }

            try
            {
                var rawPayload = _protector.Unprotect(token);

                var payload = JsonSerializer.Deserialize<
                    BillingPortalAccessTokenPayload>(
                    rawPayload);

                if (payload is null ||
                    payload.ExpiresAt <= DateTimeOffset.UtcNow)
                {
                    return false;
                }

                userId = payload.UserId;

                return userId != Guid.Empty;
            }
            catch
            {
                return false;
            }
        }

        private sealed record BillingPortalAccessTokenPayload(Guid UserId, DateTimeOffset ExpiresAt);
    }

    public sealed record BillingPortalAccessTokenResult(string Token, DateTimeOffset ExpiresAt);
}
