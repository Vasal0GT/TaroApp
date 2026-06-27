using System;
using System.Collections.Generic;
using System.Text;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Taro.Core.Enums;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Readings.Dtos;
using System.Net;
using System.Net.Http.Headers;
using Microsoft.Extensions.Logging;

namespace Taro.Infrastructure.AI
{
    public sealed class OpenAiTarotClient : IOpenAiTarotClient
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly ILogger<OpenAiTarotClient> _logger;
        private readonly HttpClient _httpClient;
        private readonly OpenAiOptions _options;

        public OpenAiTarotClient(HttpClient httpClient, IOptions<OpenAiOptions> options, ILogger<OpenAiTarotClient> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;
        }


        public async Task<TarotReadingResultDto> GenerateReadingAsync(
            TarotSpreadSize spreadSize,
            string? topic,
            string question,
            List<SelectedTarotCardDto> cards,
            CancellationToken cancellationToken = default)
        {
            var prompt = BuildPrompt(spreadSize, topic, question, cards);

            var requestBody = new
            {
                model = _options.Model,
                input = new object[]
                {
            new
            {
                role = "system",
                content = GetSystemPrompt()
            },
            new
            {
                role = "user",
                content = prompt
            }
                },
                max_output_tokens = GetMaxOutputTokens(spreadSize),
                text = new
                {
                    format = new
                    {
                        type = "json_schema",
                        name = "tarot_reading_result",
                        strict = true,
                        schema = GetResultJsonSchema()
                    }
                }
            };

            var requestJson = JsonSerializer.Serialize(
                requestBody,
                JsonOptions);

            var maxAttempts = Math.Max(1, _options.MaxAttempts);

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    // Для каждого retry создаём новый HTTP request.
                    // Старый повторно отправлять нельзя.
                    using var request = new HttpRequestMessage(
                        HttpMethod.Post,
                        "https://api.openai.com/v1/responses");

                    request.Headers.Authorization =
                        new AuthenticationHeaderValue(
                            "Bearer",
                            _options.ApiKey);

                    request.Content = new StringContent(
                        requestJson,
                        Encoding.UTF8,
                        "application/json");

                    using var response = await _httpClient.SendAsync(
                        request,
                        cancellationToken);

                    var responseText = await response.Content.ReadAsStringAsync(
                        cancellationToken);

                    if (response.IsSuccessStatusCode)
                    {
                        var outputText = ExtractOutputText(responseText);

                        var result = JsonSerializer.Deserialize<
                            TarotReadingResultDto>(
                            outputText,
                            JsonOptions);

                        if (result is null)
                        {
                            throw new InvalidOperationException(
                                "OpenAI returned invalid result.");
                        }

                        return result;
                    }

                    var isRetryable =
                        response.StatusCode == HttpStatusCode.RequestTimeout ||
                        response.StatusCode == HttpStatusCode.TooManyRequests ||
                        (int)response.StatusCode >= 500;

                    // 400 / 401 / 403 и другие постоянные ошибки не повторяем.
                    if (!isRetryable || attempt >= maxAttempts)
                    {
                        throw new InvalidOperationException(
                            $"OpenAI error. HTTP {(int)response.StatusCode}: {responseText}");
                    }

                    var retryAfter = response.Headers.RetryAfter?.Delta;

                    var baseDelaySeconds = Math.Max(
                        1,
                        _options.RetryBaseDelaySeconds);

                    var maxDelaySeconds = Math.Max(
                        baseDelaySeconds,
                        _options.RetryMaxDelaySeconds);

                    var exponentialDelaySeconds = Math.Min(
                        baseDelaySeconds * Math.Pow(2, attempt - 1),
                        maxDelaySeconds);

                    var delay = retryAfter is not null &&
                                retryAfter.Value > TimeSpan.Zero
                        ? retryAfter.Value
                        : TimeSpan.FromSeconds(exponentialDelaySeconds);

                    if (delay > TimeSpan.FromSeconds(maxDelaySeconds))
                    {
                        delay = TimeSpan.FromSeconds(maxDelaySeconds);
                    }

                    // Небольшая случайная добавка,
                    // чтобы несколько задач не повторились одновременно.
                    delay += TimeSpan.FromMilliseconds(
                        Random.Shared.Next(100, 700));

                    await Task.Delay(delay, cancellationToken);
                }
                catch (HttpRequestException)
                    when (attempt < maxAttempts)
                {
                    var baseDelaySeconds = Math.Max(
                        1,
                        _options.RetryBaseDelaySeconds);

                    var maxDelaySeconds = Math.Max(
                        baseDelaySeconds,
                        _options.RetryMaxDelaySeconds);

                    var delaySeconds = Math.Min(
                        baseDelaySeconds * Math.Pow(2, attempt - 1),
                        maxDelaySeconds);

                    var delay = TimeSpan.FromSeconds(delaySeconds) +
                                TimeSpan.FromMilliseconds(
                                    Random.Shared.Next(100, 700));

                    await Task.Delay(delay, cancellationToken);
                }
                catch (TaskCanceledException)
                    when (!cancellationToken.IsCancellationRequested &&
                          attempt < maxAttempts)
                {
                    var baseDelaySeconds = Math.Max(
                        1,
                        _options.RetryBaseDelaySeconds);

                    var maxDelaySeconds = Math.Max(
                        baseDelaySeconds,
                        _options.RetryMaxDelaySeconds);

                    var delaySeconds = Math.Min(
                        baseDelaySeconds * Math.Pow(2, attempt - 1),
                        maxDelaySeconds);

                    var delay = TimeSpan.FromSeconds(delaySeconds) +
                                TimeSpan.FromMilliseconds(
                                    Random.Shared.Next(100, 700));

                    await Task.Delay(delay, cancellationToken);
                }
            }

            throw new InvalidOperationException(
                "OpenAI request failed after all retry attempts.");
        }

        private static string GetSystemPrompt()
        {
            return """
            Ты — мягкий, эмпатичный tarot-интерпретатор внутри мобильного приложения.
            Пиши на том языке на котором сделан запрос.
            Не говори, что расклад является гарантией.
            Не давай медицинских, юридических или финансовых инструкций.
            Не пугай пользователя.
            Тон: тёплый, спокойный, мистический, но без фатализма.
            Ответ должен строго соответствовать JSON schema.
            Но не бойся трактовать карты так как почитаешь нужным, опирайся на их классические значения и интерпретируй в стиле гадания на таро.
            """;
        }

        private static string BuildPrompt(TarotSpreadSize spreadSize, string? topic, string question, List<SelectedTarotCardDto> cards)
        {
            var cardsText = string.Join(
                "\n",
                cards.Select((card, index) =>
                    $"{index + 1}. {card.Name}, {(card.IsReversed ? "перевёрнутая" : "прямая")}. Значение из колоды: {card.Meaning}"));

            return $"""
            Тема расклада: {topic ?? "не указана"}
            Размер расклада: {(int)spreadSize} карт
            Вопрос пользователя: {question}

            Выпавшие карты:
            {cardsText}

            Сформируй трактовку в формате результата приложения.

            Требования:
            - title: короткий заголовок, до 80 символов
            - shortAnswer: короткий ответ, 1 предложение
            - tags: 2 коротких тега
            - generalConclusion: общий вывод
            - cardAdvice: совет карт
            - attention: мягкое предупреждение, что это не гарантия
            - clarificationQuestions: ровно 4 вопроса для уточнения, пиши вопрос как бы от лица пользователя а не от своего лица, чтобы пользователь мог уточнить расклад, если захочет, по объему это одно иди два предложения
            - cards: ровно {(int)spreadSize} элементов, по одному на каждую карту
            - cards[].role должен объяснять роль карты в раскладе
            - cards[].meaning должен быть трактовкой карты в контексте вопроса
            """;
        }

        private static int GetMaxOutputTokens(TarotSpreadSize spreadSize)
        {
            return spreadSize switch
            {
                TarotSpreadSize.One => 700,
                TarotSpreadSize.Three => 1200,
                TarotSpreadSize.Five => 1800,
                TarotSpreadSize.Seven => 2400,
                TarotSpreadSize.Ten => 3400,
                _ => 1200
            };
        }

        private static object GetResultJsonSchema()
        {
            return new
            {
                type = "object",
                additionalProperties = false,
                required = new[]
                {
                    "title",
                    "shortAnswer",
                    "tags",
                    "generalConclusion",
                    "cardAdvice",
                    "attention",
                    "clarificationQuestions",
                    "cards"
                },
                properties = new
                {
                    title = new
                    {
                        type = "string"
                    },
                    shortAnswer = new
                    {
                        type = "string"
                    },
                    tags = new
                    {
                        type = "array",
                        minItems = 2,
                        maxItems = 2,
                        items = new
                        {
                            type = "string"
                        }
                    },
                    generalConclusion = new
                    {
                        type = "string"
                    },
                    cardAdvice = new
                    {
                        type = "string"
                    },
                    attention = new
                    {
                        type = "string"
                    },
                    clarificationQuestions = new
                    {
                        type = "array",
                        minItems = 4,
                        maxItems = 4,
                        items = new
                        {
                            type = "string"
                        }
                    },
                    cards = new
                    {
                        type = "array",
                        items = new
                        {
                            type = "object",
                            additionalProperties = false,
                            required = new[]
                            {
                                "id",
                                "role",
                                "name",
                                "position",
                                "isReversed",
                                "meaning"
                            },
                            properties = new
                            {
                                id = new
                                {
                                    type = "integer"
                                },
                                role = new
                                {
                                    type = "string"
                                },
                                name = new
                                {
                                    type = "string"
                                },
                                position = new
                                {
                                    type = "string"
                                },
                                isReversed = new
                                {
                                    type = "boolean"
                                },
                                meaning = new
                                {
                                    type = "string"
                                }
                            }
                        }
                    }
                }
            };
        }

        private static string ExtractOutputText(string responseText)
        {
            using var document = JsonDocument.Parse(responseText);

            var root = document.RootElement;

            if (!root.TryGetProperty("output", out var output))
                throw new InvalidOperationException("OpenAI response does not contain output.");

            foreach (var outputItem in output.EnumerateArray())
            {
                if (!outputItem.TryGetProperty("content", out var content))
                    continue;

                foreach (var contentItem in content.EnumerateArray())
                {
                    if (contentItem.TryGetProperty("text", out var text))
                        return text.GetString() ?? string.Empty;
                }
            }

            throw new InvalidOperationException("OpenAI response does not contain output text.");
        }

        private async Task<OpenAiHttpResult> SendWithRetryAsync(Func<HttpRequestMessage> createRequest, CancellationToken cancellationToken)
        {
            var maxAttempts = Math.Max(1, _options.MaxAttempts);

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    using var request = createRequest();

                    using var response = await _httpClient.SendAsync(
                        request,
                        cancellationToken);

                    var body = await response.Content.ReadAsStringAsync(
                        cancellationToken);

                    var result = new OpenAiHttpResult(
                        response.StatusCode,
                        body);

                    if (result.IsSuccessStatusCode ||
                        !IsRetryableStatusCode(response.StatusCode) ||
                        attempt >= maxAttempts)
                    {
                        return result;
                    }

                    var delay = GetRetryDelay(response, attempt);

                    _logger.LogWarning(
                        "OpenAI returned HTTP {StatusCode}. Retry {Attempt}/{MaxAttempts} in {Delay}.",
                        (int)response.StatusCode,
                        attempt,
                        maxAttempts,
                        delay);

                    await Task.Delay(delay, cancellationToken);
                }
                catch (HttpRequestException ex)
                    when (attempt < maxAttempts)
                {
                    var delay = GetRetryDelay(null, attempt);

                    _logger.LogWarning(
                        ex,
                        "OpenAI network error. Retry {Attempt}/{MaxAttempts} in {Delay}.",
                        attempt,
                        maxAttempts,
                        delay);

                    await Task.Delay(delay, cancellationToken);
                }
                catch (TaskCanceledException ex)
                    when (!cancellationToken.IsCancellationRequested &&
                          attempt < maxAttempts)
                {
                    var delay = GetRetryDelay(null, attempt);

                    _logger.LogWarning(
                        ex,
                        "OpenAI request timed out. Retry {Attempt}/{MaxAttempts} in {Delay}.",
                        attempt,
                        maxAttempts,
                        delay);

                    await Task.Delay(delay, cancellationToken);
                }
            }

            throw new InvalidOperationException(
                "OpenAI retry loop finished without a response.");
        }

        private static bool IsRetryableStatusCode(HttpStatusCode statusCode)
        {
            return statusCode == HttpStatusCode.RequestTimeout ||
                   statusCode == HttpStatusCode.TooManyRequests ||
                   (int)statusCode >= 500;
        }

        private TimeSpan GetRetryDelay(HttpResponseMessage? response, int attempt)
        {
            var maxDelay = TimeSpan.FromSeconds(
                Math.Max(1, _options.RetryMaxDelaySeconds));

            var retryAfter = response?.Headers.RetryAfter;

            if (retryAfter?.Delta is TimeSpan retryAfterDelta &&
                retryAfterDelta > TimeSpan.Zero)
            {
                return retryAfterDelta <= maxDelay
                    ? retryAfterDelta
                    : maxDelay;
            }

            if (retryAfter?.Date is DateTimeOffset retryAfterDate)
            {
                var delayFromDate = retryAfterDate - DateTimeOffset.UtcNow;

                if (delayFromDate > TimeSpan.Zero)
                {
                    return delayFromDate <= maxDelay
                        ? delayFromDate
                        : maxDelay;
                }
            }

            var baseDelaySeconds = Math.Max(
                1,
                _options.RetryBaseDelaySeconds);

            var exponentialSeconds = baseDelaySeconds *
                Math.Pow(2, attempt - 1);

            var delaySeconds = Math.Min(
                exponentialSeconds,
                _options.RetryMaxDelaySeconds);

            var jitterMilliseconds = Random.Shared.Next(100, 700);

            return TimeSpan.FromSeconds(delaySeconds) +
                   TimeSpan.FromMilliseconds(jitterMilliseconds);
        }

        private sealed record OpenAiHttpResult(HttpStatusCode StatusCode, string Body)
        {
            public bool IsSuccessStatusCode =>
                (int)StatusCode is >= 200 and <= 299;
        }
    }
}
