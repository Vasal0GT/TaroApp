using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Readings.Dtos
{
    public sealed class ReadingResponse
    {
        public Guid Id { get; init; }

        public TarotSpreadSize SpreadSize { get; init; }

        public string? Topic { get; init; }

        public string Question { get; init; } = string.Empty;

        public ReadingStatus Status { get; init; }

        public List<SelectedTarotCardDto> Cards { get; init; } = new();

        public TarotReadingResultDto? Result { get; init; }

        public string? ErrorMessage { get; init; }

        public DateTimeOffset CreatedAt { get; init; }

        public DateTimeOffset? CompletedAt { get; init; }
    }
}
