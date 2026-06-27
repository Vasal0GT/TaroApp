using Microsoft.EntityFrameworkCore;
using Taro.Core.Common;
using Taro.Core.Entities;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Auth.Dtos;
using System.Security.Cryptography;

namespace Taro.Core.Modules.Auth.Services
{
    public sealed class AuthService : IAuthService
    {
        private const int RefreshTokenDays = 60;
        private const int EmailCodeMinutes = 10;
        private const int MaxEmailCodeAttempts = 7;
        private const int PasswordResetCodeMinutes = 10;
        private const int PasswordResetTokenMinutes = 15;
        private const int MaxPasswordResetCodeAttempts = 5;

        private readonly IAppDbContext _db;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IRefreshTokenGenerator _refreshTokenGenerator;
        private readonly IRefreshTokenHasher _refreshTokenHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IEmailSender _emailSender;
        private readonly IEmailCodeGenerator _emailCodeGenerator;
        private readonly IExternalAuthTokenValidator _externalAuthTokenValidator;

        public AuthService(
            IAppDbContext db,
            IPasswordHasher passwordHasher,
            IRefreshTokenGenerator refreshTokenGenerator,
            IRefreshTokenHasher refreshTokenHasher,
            IJwtTokenService jwtTokenService,
            IEmailSender emailSender,
            IEmailCodeGenerator emailCodeGenerator,
            IExternalAuthTokenValidator externalAuthTokenValidator)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _refreshTokenGenerator = refreshTokenGenerator;
            _refreshTokenHasher = refreshTokenHasher;
            _jwtTokenService = jwtTokenService;
            _emailSender = emailSender; 
            _emailCodeGenerator = emailCodeGenerator;
            _externalAuthTokenValidator = externalAuthTokenValidator;
        }

        public async Task<AuthResultResponse> RegisterAsync(
            RegisterRequest request,
            CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim() ?? string.Empty;
            var normalizedEmail = NormalizeEmail(email);

            if (string.IsNullOrWhiteSpace(email))
                throw new AppException("Email is required.", 400);

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                throw new AppException("Password must contain at least 8 characters.", 400);

            var existingUser = await _db.Users
                .FirstOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);

            if (existingUser is not null)
            {
                if (existingUser.EmailVerifiedAt is null &&
                    _passwordHasher.Verify(request.Password, existingUser.PasswordHash))
                {
                    await CreateAndSendEmailVerificationCodeAsync(
                        existingUser,
                        cancellationToken);

                    return AuthResultResponse.EmailVerificationRequired(existingUser.Email);
                }

                throw new AppException("User with this email already exists.", 409);
            }

            var user = new User
            {
                Email = email,
                NormalizedEmail = normalizedEmail,
                PasswordHash = _passwordHasher.Hash(request.Password),
                EmailVerifiedAt = null,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var wallet = new Wallet
            {
                UserId = user.Id,
                User = user,
                Balance = 15,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _db.Users.Add(user);
            _db.Wallets.Add(wallet);

            await CreateAndSendEmailVerificationCodeAsync(
                user,
                cancellationToken);

            return AuthResultResponse.EmailVerificationRequired(user.Email);
        }

        public async Task<AuthResultResponse> LoginAsync(
            LoginRequest request,
            CancellationToken cancellationToken = default)
        {
            var normalizedEmail = NormalizeEmail(request.Email ?? string.Empty);

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
                throw new UnauthorizedAccessException("Invalid email or password.");

            var passwordIsValid = _passwordHasher.Verify(
                request.Password,
                user.PasswordHash);

            if (!passwordIsValid)
                throw new UnauthorizedAccessException("Invalid email or password.");

            if (user.EmailVerifiedAt is null)
            {
                await CreateAndSendEmailVerificationCodeAsync(
                    user,
                    cancellationToken);

                return AuthResultResponse.EmailVerificationRequired(user.Email);
            }

            var authResponse = await CreateAuthResponseAsync(
                user,
                cancellationToken);

            return AuthResultResponse.Authenticated(authResponse);
        }

        public async Task<AuthResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim();
            var normalizedEmail = NormalizeEmail(email);
            var code = request.Code.Trim();

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
                throw new AppException("Invalid verification code.", 400);

            var verificationCode = await _db.EmailVerificationCodes
                .Where(x =>
                    x.UserId == user.Id &&
                    x.UsedAt == null &&
                    x.ExpiresAt > DateTimeOffset.UtcNow)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (verificationCode is null)
                throw new AppException("Verification code expired. Request a new code.", 400);

            if (verificationCode.Attempts >= MaxEmailCodeAttempts)
                throw new AppException("Too many attempts. Request a new code.", 429);

            var codeIsValid = _passwordHasher.Verify(code, verificationCode.CodeHash);

            if (!codeIsValid)
            {
                verificationCode.Attempts += 1;

                await _db.SaveChangesAsync(cancellationToken);

                throw new AppException("Invalid verification code.", 400);
            }

            verificationCode.UsedAt = DateTimeOffset.UtcNow;
            user.EmailVerifiedAt ??= DateTimeOffset.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            return await CreateAuthResponseAsync(user, cancellationToken);
        }

        public async Task ResendEmailCodeAsync(ResendEmailCodeRequest request, CancellationToken cancellationToken = default)
        {
            var normalizedEmail = NormalizeEmail(request.Email ?? string.Empty);

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                return;
            }

            if (user.EmailVerifiedAt is not null)
            {
                return;
            }

            var latestCode = await _db.EmailVerificationCodes
                .Where(x => x.UserId == user.Id)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestCode is not null &&
                latestCode.CreatedAt > DateTimeOffset.UtcNow.AddSeconds(-60))
            {
                throw new AppException("Please wait before requesting a new code.", 429);
            }

            await CreateAndSendEmailVerificationCodeAsync(
                user,
                cancellationToken);
        }

        public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                throw new UnauthorizedAccessException("Refresh token is required.");

            var refreshTokenHash = _refreshTokenHasher.Hash(request.RefreshToken);

            var session = await _db.UserSessions
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.RefreshTokenHash == refreshTokenHash,
                    cancellationToken);

            if (session is null)
                throw new UnauthorizedAccessException("Invalid refresh token.");

            if (session.RevokedAt is not null)
                throw new UnauthorizedAccessException("Refresh token was revoked.");

            if (session.ExpiresAt <= DateTimeOffset.UtcNow)
                throw new UnauthorizedAccessException("Refresh token expired.");

            if (session.User.DeletedAt is not null)
                throw new UnauthorizedAccessException("User was deleted.");

            session.RevokedAt = DateTimeOffset.UtcNow;

            var newRefreshToken = _refreshTokenGenerator.Generate();
            var newSession = CreateSession(session.User, newRefreshToken);

            _db.UserSessions.Add(newSession);

            await _db.SaveChangesAsync(cancellationToken);

            return await BuildAuthResponseAsync(
                session.User,
                newSession,
                newRefreshToken,
                cancellationToken);
        }

        public async Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var activeSessions = await _db.UserSessions
                .Where(x => x.UserId == userId && x.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var session in activeSessions)
            {
                session.RevokedAt = DateTimeOffset.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task CreateAndSendEmailVerificationCodeAsync(User user, CancellationToken cancellationToken)
        {
            await RevokeActiveEmailVerificationCodesAsync(
                user.Id,
                cancellationToken);

            var code = _emailCodeGenerator.Generate();

            var verificationCode = new EmailVerificationCode
            {
                UserId = user.Id,
                User = user,
                CodeHash = _passwordHasher.Hash(code),
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(EmailCodeMinutes),
                UsedAt = null,
                Attempts = 0
            };

            _db.EmailVerificationCodes.Add(verificationCode);

            await _db.SaveChangesAsync(cancellationToken);

            await _emailSender.SendEmailVerificationCodeAsync(
                user.Email,
                code,
                cancellationToken);
        }

        private async Task RevokeActiveEmailVerificationCodesAsync(Guid userId, CancellationToken cancellationToken)
        {
            var activeCodes = await _db.EmailVerificationCodes
                .Where(x =>
                    x.UserId == userId &&
                    x.UsedAt == null &&
                    x.ExpiresAt > DateTimeOffset.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var activeCode in activeCodes)
            {
                activeCode.UsedAt = DateTimeOffset.UtcNow;
            }
        }

        private async Task<AuthResponse> CreateAuthResponseAsync(User user, CancellationToken cancellationToken)
        {
            var refreshToken = _refreshTokenGenerator.Generate();

            var session = CreateSession(user, refreshToken);

            _db.UserSessions.Add(session);

            await _db.SaveChangesAsync(cancellationToken);

            return await BuildAuthResponseAsync(
                user,
                session,
                refreshToken,
                cancellationToken);
        }

        private UserSession CreateSession(User user, string refreshToken)
        {
            return new UserSession
            {
                UserId = user.Id,
                User = user,
                RefreshTokenHash = _refreshTokenHasher.Hash(refreshToken),
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(RefreshTokenDays)
            };
        }

        private async Task<AuthResponse> BuildAuthResponseAsync(User user, UserSession session, string refreshToken, CancellationToken cancellationToken)
        {
            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);

            var accessToken = _jwtTokenService.CreateAccessToken(user, session);

            var authUser = new AuthUserDto(
                user.Id,
                user.Email,
                user.Nickname,
                user.ZodiacSign,
                user.SubscriptionTier,
                user.SubscriptionExpiresAt,
                wallet?.Balance ?? 0,
                user.EmailVerifiedAt is not null,
                user.IsOnboardingCompleted);

            return new AuthResponse(accessToken, refreshToken, authUser);
        }

        private static string NormalizeEmail(string email)
        {
            return email.Trim().ToUpperInvariant();
        }
        public async Task ForgotPasswordAsync(
    ForgotPasswordRequest request,
    CancellationToken cancellationToken = default)
        {
            var normalizedEmail = NormalizeEmail(request.Email ?? string.Empty);

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                return;
            }

            var latestCode = await _db.PasswordResetCodes
                .Where(x => x.UserId == user.Id)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestCode is not null &&
                latestCode.CreatedAt > DateTimeOffset.UtcNow.AddSeconds(-60))
            {
                throw new AppException("Please wait before requesting a new code.", 429);
            }

            await CreateAndSendPasswordResetCodeAsync(
                user,
                cancellationToken);
        }

        public async Task<VerifyPasswordResetCodeResponse> VerifyPasswordResetCodeAsync(
            VerifyPasswordResetCodeRequest request,
            CancellationToken cancellationToken = default)
        {
            var normalizedEmail = NormalizeEmail(request.Email ?? string.Empty);
            var code = request.Code.Trim();

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                throw new AppException("Invalid reset code.", 400);
            }

            var resetCode = await _db.PasswordResetCodes
                .Where(x =>
                    x.UserId == user.Id &&
                    x.UsedAt == null &&
                    x.ExpiresAt > DateTimeOffset.UtcNow)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (resetCode is null)
            {
                throw new AppException("Reset code expired. Request a new code.", 400);
            }

            if (resetCode.Attempts >= MaxPasswordResetCodeAttempts)
            {
                throw new AppException("Too many attempts. Request a new code.", 429);
            }

            var codeIsValid = _passwordHasher.Verify(
                code,
                resetCode.CodeHash);

            if (!codeIsValid)
            {
                resetCode.Attempts += 1;

                await _db.SaveChangesAsync(cancellationToken);

                throw new AppException("Invalid reset code.", 400);
            }

            resetCode.UsedAt = DateTimeOffset.UtcNow;
            user.EmailVerifiedAt ??= DateTimeOffset.UtcNow;

            var resetToken = GeneratePasswordResetToken();

            var resetTokenEntity = new PasswordResetToken
            {
                UserId = user.Id,
                User = user,
                TokenHash = _refreshTokenHasher.Hash(resetToken),
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(PasswordResetTokenMinutes),
                UsedAt = null
            };

            _db.PasswordResetTokens.Add(resetTokenEntity);

            await _db.SaveChangesAsync(cancellationToken);

            return new VerifyPasswordResetCodeResponse(resetToken);
        }

        public async Task ResetPasswordAsync(
            ResetPasswordRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.ResetToken))
            {
                throw new AppException("Reset token is required.", 400);
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) ||
                request.NewPassword.Length < 8)
            {
                throw new AppException("Password must contain at least 8 characters.", 400);
            }

            var resetTokenHash = _refreshTokenHasher.Hash(request.ResetToken);

            var resetToken = await _db.PasswordResetTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.TokenHash == resetTokenHash,
                    cancellationToken);

            if (resetToken is null)
            {
                throw new AppException("Invalid reset token.", 400);
            }

            if (resetToken.UsedAt is not null)
            {
                throw new AppException("Reset token was already used.", 400);
            }

            if (resetToken.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                throw new AppException("Reset token expired.", 400);
            }

            if (resetToken.User.DeletedAt is not null)
            {
                throw new AppException("User was deleted.", 400);
            }

            resetToken.User.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            resetToken.User.EmailVerifiedAt ??= DateTimeOffset.UtcNow;
            resetToken.UsedAt = DateTimeOffset.UtcNow;

            var activeSessions = await _db.UserSessions
                .Where(x => x.UserId == resetToken.UserId && x.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var session in activeSessions)
            {
                session.RevokedAt = DateTimeOffset.UtcNow;
            }

            var activeResetTokens = await _db.PasswordResetTokens
                .Where(x =>
                    x.UserId == resetToken.UserId &&
                    x.UsedAt == null &&
                    x.Id != resetToken.Id)
                .ToListAsync(cancellationToken);

            foreach (var activeToken in activeResetTokens)
            {
                activeToken.UsedAt = DateTimeOffset.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
        private async Task CreateAndSendPasswordResetCodeAsync(
    User user,
    CancellationToken cancellationToken)
        {
            await RevokeActivePasswordResetCodesAsync(
                user.Id,
                cancellationToken);

            var code = _emailCodeGenerator.Generate();

            var resetCode = new PasswordResetCode
            {
                UserId = user.Id,
                User = user,
                CodeHash = _passwordHasher.Hash(code),
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(PasswordResetCodeMinutes),
                UsedAt = null,
                Attempts = 0
            };

            _db.PasswordResetCodes.Add(resetCode);

            await _db.SaveChangesAsync(cancellationToken);

            await _emailSender.SendPasswordResetCodeAsync(
                user.Email,
                code,
                cancellationToken);
        }

        private async Task RevokeActivePasswordResetCodesAsync(
            Guid userId,
            CancellationToken cancellationToken)
        {
            var activeCodes = await _db.PasswordResetCodes
                .Where(x =>
                    x.UserId == userId &&
                    x.UsedAt == null &&
                    x.ExpiresAt > DateTimeOffset.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var activeCode in activeCodes)
            {
                activeCode.UsedAt = DateTimeOffset.UtcNow;
            }
        }

        private static string GeneratePasswordResetToken()
        {
            return Convert
                .ToHexString(RandomNumberGenerator.GetBytes(32))
                .ToLowerInvariant();
        }
        public async Task<AuthResultResponse> ExternalLoginAsync(ExternalLoginRequest request, CancellationToken cancellationToken = default)
        {
            var externalUser = await _externalAuthTokenValidator.ValidateAsync(
                request.Provider,
                request.IdentityToken,
                cancellationToken);

            var externalAccount = await _db.ExternalAuthAccounts
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x =>
                        x.Provider == externalUser.Provider &&
                        x.ProviderUserId == externalUser.ProviderUserId,
                    cancellationToken);

            if (externalAccount is not null)
            {
                if (externalAccount.User.DeletedAt is not null)
                    throw new UnauthorizedAccessException("User was deleted.");

                var existingResponse = await CreateAuthResponseAsync(
                    externalAccount.User,
                    cancellationToken);

                return AuthResultResponse.Authenticated(existingResponse);
            }

            if (string.IsNullOrWhiteSpace(externalUser.Email))
            {
                throw new AppException(
                    "External account email is missing. Try signing in again.",
                    400);
            }

            var email = externalUser.Email.Trim();
            var normalizedEmail = NormalizeEmail(email);

            var user = await _db.Users
                .FirstOrDefaultAsync(
                    x => x.NormalizedEmail == normalizedEmail && x.DeletedAt == null,
                    cancellationToken);

            if (user is null)
            {
                user = new User
                {
                    Email = email,
                    NormalizedEmail = normalizedEmail,
                    PasswordHash = CreateExternalAccountPasswordHash(),
                    EmailVerifiedAt = DateTimeOffset.UtcNow,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                var wallet = new Wallet
                {
                    UserId = user.Id,
                    User = user,
                    Balance = 0,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _db.Users.Add(user);
                _db.Wallets.Add(wallet);
            }
            else
            {
                if (externalUser.EmailVerified)
                {
                    user.EmailVerifiedAt ??= DateTimeOffset.UtcNow;
                }

                var walletExists = await _db.Wallets
                    .AnyAsync(x => x.UserId == user.Id, cancellationToken);

                if (!walletExists)
                {
                    _db.Wallets.Add(new Wallet
                    {
                        UserId = user.Id,
                        User = user,
                        Balance = 0,
                        UpdatedAt = DateTimeOffset.UtcNow
                    });
                }
            }

            var newExternalAccount = new ExternalAuthAccount
            {
                UserId = user.Id,
                User = user,
                Provider = externalUser.Provider,
                ProviderUserId = externalUser.ProviderUserId,
                Email = email,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _db.ExternalAuthAccounts.Add(newExternalAccount);

            var authResponse = await CreateAuthResponseAsync(
                user,
                cancellationToken);

            return AuthResultResponse.Authenticated(authResponse);
        }
        private string CreateExternalAccountPasswordHash()
        {
            var randomPassword = Convert
                .ToHexString(RandomNumberGenerator.GetBytes(32))
                .ToLowerInvariant();

            return _passwordHasher.Hash(randomPassword);
        }
    }
}