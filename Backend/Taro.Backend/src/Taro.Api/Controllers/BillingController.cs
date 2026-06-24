using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using Taro.Api.Billing;
using Taro.Core.Common;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Api.Controllers
{
    [ApiController]
    [Route("api/billing")]
    [Authorize]
    public sealed class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;
        private readonly IWebHostEnvironment _environment;
        private readonly BillingPortalOptions _billingPortalOptions;

        public BillingController(IBillingService billingService, IWebHostEnvironment environment, IOptions<BillingPortalOptions> billingPortalOptions)
        {
            _billingService = billingService;
            _environment = environment;
            _billingPortalOptions = billingPortalOptions.Value;
        }

        [HttpGet("me")]
        public async Task<ActionResult<BillingAccountDto>> GetMyBillingAccount(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _billingService.GetAccountAsync(userId, cancellationToken);

            return Ok(response);
        }

        [HttpPost("subscriptions/{subscriptionId:guid}/auto-renew")]
        public async Task<ActionResult<BillingAccountDto>> SetAutoRenew(Guid subscriptionId, [FromBody] SetAutoRenewRequest request, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _billingService.SetAutoRenewAsync(
                userId,
                subscriptionId,
                request.Enabled,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("subscriptions/{subscriptionId:guid}/cancel")]
        public async Task<ActionResult<BillingAccountDto>> CancelSubscription(Guid subscriptionId, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _billingService.CancelSubscriptionAsync(
                userId,
                subscriptionId,
                cancellationToken);

            return Ok(response);
        }

        // Временный endpoint.
        // Позже его заменит успешный webhook YooKassa.
        [HttpPost("dev/activate-plus")]
        public async Task<ActionResult<BillingAccountDto>> ActivatePlusForDevelopment([FromBody] ActivatePlusForDevelopmentRequest request, CancellationToken cancellationToken)
        {
            EnsureDevelopment();

            var userId = GetCurrentUserId();

            var response = await _billingService
                .ActivatePlusForDevelopmentAsync(
                    userId,
                    request.StarsPerMonth,
                    cancellationToken);

            return Ok(response);
        }

        // Временный endpoint для проверки операций кошелька.
        [HttpPost("dev/grant-stars")]
        public async Task<ActionResult<BillingAccountDto>> GrantStarsForDevelopment([FromBody] GrantStarsForDevelopmentRequest request, CancellationToken cancellationToken)
        {
            EnsureDevelopment();

            var userId = GetCurrentUserId();

            var response = await _billingService
                .GrantStarsForDevelopmentAsync(
                    userId,
                    request.Stars,
                    cancellationToken);

            return Ok(response);
        }

        private Guid GetCurrentUserId()
        {
            var rawUserId =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("sub")?.Value;

            if (!Guid.TryParse(rawUserId, out var userId))
            {
                throw new AppException("Unauthorized.", 401);
            }

            return userId;
        }

        private void EnsureDevelopment()
        {
            if (!_environment.IsDevelopment())
            {
                throw new AppException("Not found.", 404);
            }
        }

        [HttpPost("checkout/plus")]
        public async Task<ActionResult<CreateCheckoutResponse>> CreatePlusCheckout(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _billingService.CreatePlusCheckoutAsync(
                userId,
                cancellationToken);

            return Ok(response);
        }

        [HttpPost("portal-links")]
        public async Task<ActionResult<CreateBillingPortalLinkResponse>> CreatePortalLink(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var portalSession = await _billingService
                .CreateBillingPortalSessionAsync(
                    userId,
                    cancellationToken);

            var baseUrl = _billingPortalOptions.BaseUrl
                .Trim()
                .TrimEnd('/');

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                throw new AppException(
                    "Billing portal base URL is not configured.",
                    500);
            }

            var url =
                $"{baseUrl}/payment?t={Uri.EscapeDataString(portalSession.Token)}";

            return Ok(new CreateBillingPortalLinkResponse(
                url,
                portalSession.ExpiresAt));
        }
    }
}
