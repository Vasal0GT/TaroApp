using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Core.Modules.Auth.Services
{
    public interface IAuthService
    {
        Task<AuthResultResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
        Task<AuthResultResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default);
        Task ResendEmailCodeAsync(ResendEmailCodeRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default);
        Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default);
        Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
        Task<VerifyPasswordResetCodeResponse> VerifyPasswordResetCodeAsync(VerifyPasswordResetCodeRequest request, CancellationToken cancellationToken = default);
        Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
        Task<AuthResultResponse> ExternalLoginAsync(ExternalLoginRequest request, CancellationToken cancellationToken = default);
    }
}
