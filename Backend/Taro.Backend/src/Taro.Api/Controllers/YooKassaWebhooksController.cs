using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Api.Controllers
{
    [Route("api/webhooks/yookassa")]
    [ApiController]
    [AllowAnonymous]
    public sealed class YooKassaWebhooksController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public YooKassaWebhooksController(
            IBillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpPost]
        public async Task<IActionResult> Receive([FromBody] YooKassaWebhookNotification notification, CancellationToken cancellationToken)
        {
            if (notification.Type != "notification" ||
                string.IsNullOrWhiteSpace(notification.Event) ||
                string.IsNullOrWhiteSpace(notification.Object.Id))
            {
                return Ok();
            }

            if (notification.Event == "payment.succeeded")
            {
                await _billingService
                    .ProcessYooKassaPaymentSucceededAsync(
                        notification.Object.Id,
                        cancellationToken);
            }

            if (notification.Event == "payment.canceled")
            {
                await _billingService
                    .ProcessYooKassaPaymentCanceledAsync(
                        notification.Object.Id,
                        cancellationToken);
            }

            return Ok();
        }
    }
}
