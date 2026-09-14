using Taro.Core.Interfaces;

namespace Taro.Worker.Services
{
    public sealed class SubscriptionRenewalHostedService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionRenewalHostedService> _logger;

        public SubscriptionRenewalHostedService(
            IServiceScopeFactory scopeFactory,
            ILogger<SubscriptionRenewalHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await RenewAsync(stoppingToken);

            using var timer = new PeriodicTimer(Interval);
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RenewAsync(stoppingToken);
            }
        }

        private async Task RenewAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var billingService = scope.ServiceProvider
                    .GetRequiredService<IBillingService>();

                var noticeCount = await billingService
                    .SendDueSubscriptionRenewalNoticesAsync(
                        DateTimeOffset.UtcNow,
                        cancellationToken);

                var createdCount = await billingService
                    .CreateDueSubscriptionRenewalsAsync(
                        DateTimeOffset.UtcNow,
                        cancellationToken);

                if (noticeCount > 0)
                {
                    _logger.LogInformation(
                        "Sent {Count} subscription renewal notice(s).",
                        noticeCount);
                }

                var grantedCount = await billingService
                    .GrantDueSubscriptionStarsAsync(
                        DateTimeOffset.UtcNow,
                        cancellationToken);

                if (createdCount > 0)
                {
                    _logger.LogInformation(
                        "Created {Count} subscription renewal payment(s).",
                        createdCount);
                }

                if (grantedCount > 0)
                {
                    _logger.LogInformation(
                        "Granted monthly subscription stars to {Count} subscription(s).",
                        grantedCount);
                }
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                // Worker штатно останавливается.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Subscription renewal cycle failed.");
            }
        }
    }
}
