using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Readings.Dtos
{
    public sealed class SelectedTarotCardDto
    {
        public int Id { get; init; }

        public string Name { get; init; } = string.Empty;

        public bool IsReversed { get; init; }

        public string Position { get; init; } = string.Empty;

        public string Meaning { get; init; } = string.Empty;
    }
}
