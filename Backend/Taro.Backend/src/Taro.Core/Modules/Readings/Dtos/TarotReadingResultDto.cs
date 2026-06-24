using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Readings.Dtos
{
    public sealed class TarotReadingResultDto
    {
        public string Title { get; init; } = string.Empty;

        public string ShortAnswer { get; init; } = string.Empty;

        public List<string> Tags { get; init; } = new();

        public string GeneralConclusion { get; init; } = string.Empty;

        public string CardAdvice { get; init; } = string.Empty;

        public string Attention { get; init; } = string.Empty;

        public List<string> ClarificationQuestions { get; init; } = new();

        public List<TarotReadingResultCardDto> Cards { get; init; } = new();
    }
    public sealed class TarotReadingResultCardDto
    {
        public int Id { get; init; }

        public string Role { get; init; } = string.Empty;

        public string Name { get; init; } = string.Empty;

        public string Position { get; init; } = string.Empty;

        public bool IsReversed { get; init; }

        public string Meaning { get; init; } = string.Empty;
    }
}
