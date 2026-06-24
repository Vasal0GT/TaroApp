using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Entities
{
    public sealed class TarotReading
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public TarotSpreadSize SpreadSize { get; set; }

        public string? Topic { get; set; }

        public string Question { get; set; } = string.Empty;

        public ReadingStatus Status { get; set; } = ReadingStatus.Queued;

        public string CardsJson { get; set; } = string.Empty;

        public string? ResultJson { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? StartedAt { get; set; }

        public DateTimeOffset? CompletedAt { get; set; }
    }
}
