using System;
using System.Collections.Generic;
using System.Text;
using MassTransit;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Readings.Messages;

namespace Taro.Worker.Consumers
{
    public sealed class GenerateTarotReadingConsumer : IConsumer<GenerateTarotReadingMessage>
    {
        private readonly IReadingService _readingService;
        private readonly ILogger<GenerateTarotReadingConsumer> _logger;

        public GenerateTarotReadingConsumer(IReadingService readingService, ILogger<GenerateTarotReadingConsumer> logger)
        {
            _readingService = readingService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<GenerateTarotReadingMessage> context)
        {
            _logger.LogInformation( "Generating tarot reading {ReadingId}", context.Message.ReadingId);

            await _readingService.ProcessAsync(context.Message.ReadingId, context.CancellationToken);
        }
    }
}
