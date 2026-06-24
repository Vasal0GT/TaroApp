using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Infrastructure.AI
{
    public sealed class OpenAiOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = "gpt-5.4-mini";

        public int MaxAttempts { get; set; } = 4;

        public int RetryBaseDelaySeconds { get; set; } = 2;

        public int RetryMaxDelaySeconds { get; set; } = 20;
    }
}
