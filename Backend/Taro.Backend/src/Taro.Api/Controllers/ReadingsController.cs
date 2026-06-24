using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Readings.Dtos;
using Taro.Core.Modules.Readings.Messages;

namespace Taro.Api.Controllers
{
    [Route("api/readings")]
    [ApiController]
    [Authorize]
    public sealed class ReadingsController : ControllerBase
    {
        private readonly IReadingService _readingService;
        private readonly IPublishEndpoint _publishEndpoint;

        public ReadingsController(IReadingService readingService, IPublishEndpoint publishEndpoint)
        {
            _readingService = readingService;
            _publishEndpoint = publishEndpoint;
        }

        [HttpPost]
        public async Task<ActionResult<ReadingResponse>> Create(CreateReadingRequest request, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _readingService.CreateAsync(userId, request, cancellationToken);

            await _publishEndpoint.Publish(
                new GenerateTarotReadingMessage(response.Id),
                cancellationToken);

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ReadingResponse>> Get(Guid id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            var response = await _readingService.GetAsync(
                userId,
                id,
                cancellationToken);

            return Ok(response);
        }

        private Guid GetCurrentUserId()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
                throw new UnauthorizedAccessException("Invalid access token.");

            return userId;
        }
    }
}
