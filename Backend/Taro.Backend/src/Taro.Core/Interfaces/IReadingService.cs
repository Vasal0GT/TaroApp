using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Modules.Readings.Dtos;

namespace Taro.Core.Interfaces
{
    public interface IReadingService
    {
        Task<ReadingResponse> CreateAsync(Guid userId, CreateReadingRequest request, CancellationToken cancellationToken = default);
        Task<ReadingResponse> GetAsync(Guid userId, Guid readingId, CancellationToken cancellationToken = default);
        Task ProcessAsync(Guid readingId, CancellationToken cancellationToken = default);
    }
}
