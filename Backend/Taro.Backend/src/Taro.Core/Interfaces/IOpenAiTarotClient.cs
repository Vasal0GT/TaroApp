using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Enums;
using Taro.Core.Modules.Readings.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IOpenAiTarotClient
    {
        Task<TarotReadingResultDto> GenerateReadingAsync(TarotSpreadSize spreadSize, string? topic, string question, List<SelectedTarotCardDto> cards, CancellationToken cancellationToken = default);
    }
}
