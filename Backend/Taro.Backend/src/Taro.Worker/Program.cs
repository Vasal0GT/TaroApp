using MassTransit;
using Taro.Infrastructure;
using Taro.Worker.Consumers;
using Taro.Worker.Services;

namespace Taro.Worker
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);

            var openAiRequestsPerSecond = builder.Configuration.GetValue<int?>("ReadingWorker:OpenAiRequestsPerSecond") ?? 6;

            var concurrentMessageLimit = builder.Configuration.GetValue<int?>("ReadingWorker:ConcurrentMessageLimit") ?? 20;

            var prefetchCount = builder.Configuration.GetValue<int?>("ReadingWorker:PrefetchCount") ?? 20;

            if (openAiRequestsPerSecond <= 0)
            {
                throw new InvalidOperationException(
                    "ReadingWorker:OpenAiRequestsPerSecond must be greater than zero.");
            }

            if (concurrentMessageLimit <= 0)
            {
                throw new InvalidOperationException(
                    "ReadingWorker:ConcurrentMessageLimit must be greater than zero.");
            }

            if (prefetchCount <= 0 || prefetchCount > ushort.MaxValue)
            {
                throw new InvalidOperationException(
                    $"ReadingWorker:PrefetchCount must be between 1 and {ushort.MaxValue}.");
            }

            builder.Services.AddInfrastructure(builder.Configuration);

            builder.Services.AddHostedService<YooKassaReconciliationHostedService>();
            builder.Services.AddHostedService<SubscriptionRenewalHostedService>();

            builder.Services.AddMassTransit(x =>
            {
                x.AddConsumer<GenerateTarotReadingConsumer>();

                x.UsingRabbitMq((context, cfg) =>
                {
                    var rabbitHost =
                        builder.Configuration["RabbitMQ:Host"] ?? "localhost";

                    var rabbitUsername =
                        builder.Configuration["RabbitMQ:Username"] ?? "guest";

                    var rabbitPassword =
                        builder.Configuration["RabbitMQ:Password"] ?? "guest";

                    var queueName =
                        builder.Configuration["RabbitMQ:QueueName"]
                        ?? "tarot-readings";

                    cfg.Host(rabbitHost, "/", h =>
                    {
                        h.Username(rabbitUsername);
                        h.Password(rabbitPassword);
                    });

                    cfg.ReceiveEndpoint(queueName, endpoint =>
                    {
                        // RabbitMQ не отдаст Worker больше 20 сообщений,
                        // которые ещё не завершились.
                        endpoint.PrefetchCount = (ushort)prefetchCount;

                        // Одновременно обработается максимум 20 раскладов.
                        endpoint.ConcurrentMessageLimit = concurrentMessageLimit;

                        // Новые вызовы OpenAI начинаются не чаще 6 раз в секунду.
                        endpoint.UseRateLimit(openAiRequestsPerSecond, TimeSpan.FromSeconds(1));

                        // Все настройки endpoint должны быть ДО consumer.
                        endpoint.ConfigureConsumer<GenerateTarotReadingConsumer>(context);
                    });
                });
            });

            var host = builder.Build();

            host.Run();
        }
    }
}
