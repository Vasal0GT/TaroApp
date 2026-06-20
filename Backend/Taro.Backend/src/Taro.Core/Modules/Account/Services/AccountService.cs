using Microsoft.EntityFrameworkCore;
using Taro.Core.Common;
using Taro.Core.Entities;
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