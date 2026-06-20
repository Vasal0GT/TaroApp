using System.Net;
using System.Text.Json;
using Taro.Core.Common;

namespace Taro.Api.Middleware
{
    public sealed class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException exception)
            {
                await WriteErrorAsync(
                    context,
                    (HttpStatusCode)exception.StatusCode,
                    exception.Message);
            }
            catch (UnauthorizedAccessException exception)
            {
                await WriteErrorAsync(
                    context,
                    HttpStatusCode.Unauthorized,
                    exception.Message);
            }
            catch (KeyNotFoundException exception)
            {
                await WriteErrorAsync(
                    context,
                    HttpStatusCode.NotFound,
                    exception.Message);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unhandled exception");

                await WriteErrorAsync(
                    context,
                    HttpStatusCode.InternalServerError,
                    "Internal server error.");
            }
        }

        private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode statusCode, string message)
        {
            if (context.Response.HasStarted)
            {
                return;
            }

            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";

            var json = JsonSerializer.Serialize(new
            {
                error = message
            });

            await context.Response.WriteAsync(json);
        }
    }
}