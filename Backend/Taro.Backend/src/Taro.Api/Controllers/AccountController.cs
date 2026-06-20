using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Account.Dtos;
using Taro.Core.Modules.Auth.Dtos;

namespace Taro.Api.Controllers
{
    [Route("api/account")]
    [ApiController]
    [Authorize]
    public sealed class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<AuthUserDto>> GetMe(
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _accountService.GetMeAsync(
                userId,
                cancellationToken);

            return Ok(response);
        }

        [HttpPut("onboarding")]
        public async Task<ActionResult<AuthUserDto>> CompleteOnboarding(
            CompleteOnboardingRequest request,
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _accountService.CompleteOnboardingAsync(
                userId,
                request,
                cancellationToken);

            return Ok(response);
        }

        private Guid GetCurrentUserId()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                throw new UnauthorizedAccessException("Invalid access token.");

            return userId;
        }
    }
}