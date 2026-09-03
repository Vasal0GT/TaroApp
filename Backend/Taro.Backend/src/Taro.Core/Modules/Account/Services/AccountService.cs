using Microsoft.EntityFrameworkCore;
using Taro.Core.Common;
using Taro.Core.Entities;
using Taro.Core.Enums;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Account.Dtos;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Core.Modules.Account.Services
{
    public sealed class AccountService : IAccountService
    {
        private static readonly HashSet<string> AllowedZodiacSigns = new(StringComparer.OrdinalIgnoreCase)
        {
            "aries",
            "taurus",
            "gemini",
            "cancer",
            "leo",
            "virgo",
            "libra",
            "scorpio",
            "sagittarius",
            "capricorn",
            "aquarius",
            "pisces"
        };

        private readonly IAppDbContext _db;

        public AccountService(IAppDbContext db)
        {
            _db = db;
        }

        public async Task<AuthUserDto> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.Id == userId && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
                throw new KeyNotFoundException("User not found.");

            return await BuildAuthUserDtoAsync(user, cancellationToken);
        }

        public async Task<AuthUserDto> CompleteOnboardingAsync(Guid userId, CompleteOnboardingRequest request, CancellationToken cancellationToken = default)
        {
            var nickname = request.Nickname.Trim();
            var zodiacSign = request.ZodiacSign.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(nickname))
                throw new AppException("Nickname is required.", 400);

            if (nickname.Length < 2 || nickname.Length > 32)
                throw new AppException("Nickname must contain from 2 to 32 characters.", 400);

            if (!AllowedZodiacSigns.Contains(zodiacSign))
                throw new AppException("Invalid zodiac sign.", 400);

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.Id == userId && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
                throw new KeyNotFoundException("User not found.");

            if (user.EmailVerifiedAt is null)
                throw new AppException("Email must be verified before onboarding.", 403);

            user.Nickname = nickname;
            user.ZodiacSign = zodiacSign;
            user.IsOnboardingCompleted = true;

            await _db.SaveChangesAsync(cancellationToken);

            return await BuildAuthUserDtoAsync(user, cancellationToken);
        }

        public async Task DeleteAccountAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var user = await _db.Users
                .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

            if (user is null || user.DeletedAt is not null)
                return;

            var now = DateTimeOffset.UtcNow;

            var sessions = await _db.UserSessions
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var emailVerificationCodes = await _db.EmailVerificationCodes
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var passwordResetCodes = await _db.PasswordResetCodes
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var passwordResetTokens = await _db.PasswordResetTokens
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var externalAuthAccounts = await _db.ExternalAuthAccounts
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var billingPortalSessions = await _db.BillingPortalSessions
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var subscriptions = await _db.Subscriptions
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken);

            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

            _db.UserSessions.RemoveRange(sessions);
            _db.EmailVerificationCodes.RemoveRange(emailVerificationCodes);
            _db.PasswordResetCodes.RemoveRange(passwordResetCodes);
            _db.PasswordResetTokens.RemoveRange(passwordResetTokens);
            _db.ExternalAuthAccounts.RemoveRange(externalAuthAccounts);
            _db.BillingPortalSessions.RemoveRange(billingPortalSessions);

            foreach (var subscription in subscriptions)
            {
                subscription.AutoRenewEnabled = false;
                subscription.NextChargeAt = null;
                subscription.NextStarsGrantAt = null;
                subscription.StarsPerMonth = 0;
                subscription.YooKassaPaymentMethodId = null;

                if (subscription.Status is SubscriptionStatus.Active
                    or SubscriptionStatus.CancelAtPeriodEnd
                    or SubscriptionStatus.PaymentFailed)
                {
                    subscription.Status = SubscriptionStatus.Canceled;
                    subscription.CanceledAt ??= now;
                }
            }

            if (wallet is not null)
            {
                wallet.Balance = 0;
                wallet.UpdatedAt = now;
            }

            var anonymizedEmail = $"deleted-{user.Id:N}@users.invalid";

            user.Email = anonymizedEmail;
            user.NormalizedEmail = anonymizedEmail.ToUpperInvariant();
            user.PasswordHash = string.Empty;
            user.EmailVerifiedAt = null;
            user.SubscriptionTier = SubscriptionTier.Free;
            user.SubscriptionExpiresAt = null;
            user.Nickname = null;
            user.ZodiacSign = null;
            user.IsOnboardingCompleted = false;
            user.DeletedAt = now;

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<AuthUserDto> BuildAuthUserDtoAsync(User user, CancellationToken cancellationToken)
        {
            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(
                    x => x.UserId == user.Id,
                    cancellationToken);

            return new AuthUserDto(
                user.Id,
                user.Email,
                user.Nickname,
                user.ZodiacSign,
                user.SubscriptionTier,
                user.SubscriptionExpiresAt,
                wallet?.Balance ?? 0,
                user.EmailVerifiedAt is not null,
                user.IsOnboardingCompleted);
        }
    }
}
