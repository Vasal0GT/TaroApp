using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Modules.Readings.Messages
{
    public sealed record GenerateTarotReadingMessage(Guid ReadingId);
}
