using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Taro.Core.Modules.Auth.Dtos;
using Taro.Core.Modules.Auth.Services;

namespace Taro.Api.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResultResponse>> Register(
            RegisterRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _authService.RegisterAsync(
                request,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResultResponse>> Login(
            LoginRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _authService.LoginAsync(
                request,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("verify-email")]
        public async Task<ActionResult<AuthResponse>> VerifyEmail(VerifyEmailRequest request, CancellationToken cancellationToken)
        {
            var response = await _authService.VerifyEmailAsync(
                request,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("resend-email-code")]
        public async Task<IActionResult> ResendEmailCode(ResendEmailCodeRequest request, CancellationToken cancellationToken)
        {
            await _authService.ResendEmailCodeAsync(
                request,
                cancellationToken);

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
        {
            await _authService.ForgotPasswordAsync(
                request,
                cancellationToken);

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost("verify-password-reset-code")]
        public async Task<ActionResult<VerifyPasswordResetCodeResponse>> VerifyPasswordResetCode(VerifyPasswordResetCodeRequest request, CancellationToken cancellationToken)
        {
            var response = await _authService.VerifyPasswordResetCodeAsync(
                request,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
        {
            await _authService.ResetPasswordAsync(
                request,
                cancellationToken);

            return Ok(new
            {
                success = true
            });
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken cancellationToken)
        {
            var response = await _authService.RefreshAsync(
                request,
                cancellationToken);

            return Ok(response);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            await _authService.LogoutAsync(userId, cancellationToken);

            return NoContent();
        }

        private Guid GetCurrentUserId()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                throw new UnauthorizedAccessException("Invalid access token.");

            return userId;
        }

        [HttpPost("external")]
        public async Task<ActionResult<AuthResultResponse>> ExternalLogin(ExternalLoginRequest request, CancellationToken cancellationToken)
        {
            var response = await _authService.ExternalLoginAsync(
                request,
                cancellationToken);

            return Ok(response);
        }
    }
}
