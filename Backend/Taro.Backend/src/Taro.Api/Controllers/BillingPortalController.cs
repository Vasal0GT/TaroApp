using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Taro.Api.Billing;
using Taro.Core.Common;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Api.Controllers
{
    [Route("api/billing/portal")]
    [ApiController]
    [AllowAnonymous]
    public sealed class BillingPortalController : ControllerBase
    {
        private readonly IBillingService _billingService;
        private readonly BillingPortalAccessTokenService _portalAccessTokens;

        public BillingPortalController(IBillingService billingService, BillingPortalAccessTokenService portalAccessTokens)
        {
            _billingService = billingService;
            _portalAccessTokens = portalAccessTokens;
        }

        [HttpPost("exchange")]
        public async Task<ActionResult<ExchangeBillingPortalLinkResponse>> Exchange([FromBody] ExchangeBillingPortalLinkRequest request, CancellationToken cancellationToken)
        {
            var userId = await _billingService
                .ConsumeBillingPortalSessionAsync(
                    request.Token,
                    cancellationToken);

            var accessToken = _portalAccessTokens.Create(userId);

            return Ok(new ExchangeBillingPortalLinkResponse(
                accessToken.Token,
                accessToken.ExpiresAt));
        }

        [HttpGet("me")]
        public async Task<ActionResult<BillingPortalAccountDto>> GetMe(CancellationToken cancellationToken)
        {
            var userId = GetPortalUserId();

            var account = await _billingService.GetPortalAccountAsync(
                userId,
                cancellationToken);

            return Ok(account);
        }

        [HttpPost("checkout/plus")]
        public async Task<ActionResult<CreateCheckoutResponse>> CreatePlusCheckout(CancellationToken cancellationToken)
        {
            var userId = GetPortalUserId();

            var checkout = await _billingService
                .CreatePlusCheckoutAsync(
                    userId,
                    cancellationToken);

            return Ok(checkout);
        }

        [HttpPost("checkout")]
        public async Task<ActionResult<CreateCheckoutResponse>> CreateCheckout(
            [FromBody] CreatePortalCheckoutRequest request,
            CancellationToken cancellationToken)
        {
            var userId = GetPortalUserId();

            var checkout = await _billingService
                .CreateCheckoutAsync(
                    userId,
                    request.PlanCode,
                    request.StarPackCode,
                    cancellationToken);

            return Ok(checkout);
        }

        [HttpPost("subscriptions/{subscriptionId:guid}/auto-renew")]
        public async Task<ActionResult<BillingAccountDto>> SetAutoRenew(Guid subscriptionId, [FromBody] SetAutoRenewRequest request, CancellationToken cancellationToken)
        {
            var userId = GetPortalUserId();

            var account = await _billingService.SetAutoRenewAsync(
                userId,
                subscriptionId,
                request.Enabled,
                cancellationToken);

            return Ok(account);
        }

        [HttpPost("subscriptions/{subscriptionId:guid}/cancel")]
        public async Task<ActionResult<BillingAccountDto>> CancelSubscription( Guid subscriptionId, CancellationToken cancellationToken)
        {
            var userId = GetPortalUserId();

            var account = await _billingService
                .CancelSubscriptionAsync(
                    userId,
                    subscriptionId,
                    cancellationToken);

            return Ok(account);
        }

        private Guid GetPortalUserId()
        {
            var token = Request.Headers[
                "X-Billing-Portal-Token"
            ].FirstOrDefault();

            if (!_portalAccessTokens.TryGetUserId(
                    token,
                    out var userId))
            {
                throw new AppException(
                    "Billing portal session is invalid or expired.",
                    401);
            }

            return userId;
        }
    }
}
