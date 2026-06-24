using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Interfaces;

namespace Taro.Worker.Services
{
    public sealed class YooKassaReconciliationHostedService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<YooKassaReconciliationHostedService> _logger;

        public YooKassaReconciliationHostedService(IServiceScopeFactory scopeFactory, ILogger<YooKassaReconciliationHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await ReconcileAsync(stoppingToken);

            using var timer = new PeriodicTimer(Interval);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ReconcileAsync(stoppingToken);
            }
        }

        private async Task ReconcileAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var billingService = scope.ServiceProvider
                    .GetRequiredService<IBillingService>();

                var finalizedCount = await billingService
                    .ReconcilePendingYooKassaPaymentsAsync(
                        cancellationToken);

                if (finalizedCount > 0)
                {
                    _logger.LogInformation(
                        "YooKassa reconciliation finalized {Count} payment(s).",
                        finalizedCount);
                }
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                // Worker штатно останавливается.
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "YooKassa reconciliation failed.");
            }
        }
    }
}
