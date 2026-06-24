using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using Taro.Core.Enums;

namespace Taro.Core.Modules.Readings.Dtos
{
    public sealed class CreateReadingRequest
    {
        public TarotSpreadSize SpreadSize { get; init; }

        [MaxLength(64)]
        public string? Topic { get; init; }

        [Required]
        [MaxLength(200)]
        public string Question { get; init; } = string.Empty;

        [Required]
        public List<SelectedTarotCardDto> Cards { get; init; } = new();
    }
}
