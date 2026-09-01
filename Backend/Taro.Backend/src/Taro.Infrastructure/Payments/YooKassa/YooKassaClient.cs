using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Taro.Core.Common;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Billing.Dtos;

namespace Taro.Infrastructure.Payments.YooKassa
{
    public sealed class YooKassaClient : IYooKassaClient
    {
        private static readonly JsonSerializerOptions ResponseJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient;
        private readonly YooKassaOptions _options;

        public YooKassaClient(HttpClient httpClient, IOptions<YooKassaOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public async Task<YooKassaCreatePaymentResult> CreateRedirectPaymentAsync(YooKassaCreatePaymentRequest request, CancellationToken cancellationToken = default)
        {
            ValidateOptions();

            var payload = new
            {
                amount = new
                {
                    value = request.Amount.ToString("F2", CultureInfo.InvariantCulture),
                    currency = request.Currency
                },

                capture = true,

                confirmation = new
                {
                    type = "redirect",
                    return_url = _options.ReturnUrl
                },

                description = request.Description,

                // Просим YooKassa сохранить способ оплаты.
                // Он понадобится позже для автопродления.
                save_payment_method = request.SavePaymentMethod,

                metadata = new
                {
                    payment_order_id = request.PaymentOrderId.ToString()
                }
            };

            var json = JsonSerializer.Serialize(payload);

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v3/payments");

            httpRequest.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var basicAuthValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ShopId}:{_options.SecretKey}"));

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuthValue);
            httpRequest.Headers.Add("Idempotence-Key", request.IdempotenceKey);

            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new AppException(
                    $"YooKassa could not create payment. HTTP {(int)response.StatusCode}.",
                    502);
            }

            var payment = JsonSerializer.Deserialize<YooKassaPaymentResponse>(rawResponse, ResponseJsonOptions);

            if (payment is null || string.IsNullOrWhiteSpace(payment.Id))
            {
                throw new AppException(
                    "YooKassa returned an invalid payment response.",
                    502);
            }

            return new YooKassaCreatePaymentResult(
                payment.Id,
                payment.Status,
                payment.Paid,
                payment.Confirmation?.ConfirmationUrl,
                rawResponse);
        }

        public async Task<YooKassaCreatePaymentResult> CreateRecurringPaymentAsync(
            YooKassaCreateRecurringPaymentRequest request,
            CancellationToken cancellationToken = default)
        {
            ValidateOptions();

            var payload = new
            {
                amount = new
                {
                    value = request.Amount.ToString("F2", CultureInfo.InvariantCulture),
                    currency = request.Currency
                },
                capture = true,
                payment_method_id = request.PaymentMethodId,
                description = request.Description,
                metadata = new
                {
                    payment_order_id = request.PaymentOrderId.ToString()
                }
            };

            var json = JsonSerializer.Serialize(payload);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v3/payments")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            var basicAuthValue = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_options.ShopId}:{_options.SecretKey}"));

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuthValue);
            httpRequest.Headers.Add("Idempotence-Key", request.IdempotenceKey);

            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new AppException(
                    $"YooKassa could not create recurring payment. HTTP {(int)response.StatusCode}.",
                    502);
            }

            var payment = JsonSerializer.Deserialize<YooKassaPaymentResponse>(
                rawResponse,
                ResponseJsonOptions);

            if (payment is null || string.IsNullOrWhiteSpace(payment.Id))
            {
                throw new AppException(
                    "YooKassa returned an invalid recurring payment response.",
                    502);
            }

            return new YooKassaCreatePaymentResult(
                payment.Id,
                payment.Status,
                payment.Paid,
                payment.Confirmation?.ConfirmationUrl,
                rawResponse);
        }

        public async Task<YooKassaPaymentDetails> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default)
        {
            ValidateOptions();

            if (string.IsNullOrWhiteSpace(paymentId))
            {
                throw new AppException(
                    "YooKassa payment id is required.",
                    400);
            }

            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"v3/payments/{Uri.EscapeDataString(paymentId)}");

            var basicAuthValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ShopId}:{_options.SecretKey}"));

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuthValue);

            using var response = await _httpClient.SendAsync(
                httpRequest,
                cancellationToken);

            var rawResponse = await response.Content.ReadAsStringAsync(
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new AppException(
                    $"YooKassa could not get payment. HTTP {(int)response.StatusCode}.",
                    502);
            }

            var payment = JsonSerializer.Deserialize<YooKassaPaymentDetailsResponse>(rawResponse, ResponseJsonOptions);

            if (payment is null ||
                string.IsNullOrWhiteSpace(payment.Id) ||
                payment.Amount is null ||
                !decimal.TryParse(
                    payment.Amount.Value,
                    NumberStyles.Number,
                    CultureInfo.InvariantCulture,
                    out var amount))
            {
                throw new AppException(
                    "YooKassa returned an invalid payment response.",
                    502);
            }

            return new YooKassaPaymentDetails(
                payment.Id,
                payment.Status,
                payment.Paid,
                amount,
                payment.Amount.Currency,
                payment.PaymentMethod?.Id,
                payment.PaymentMethod?.Saved ?? false,
                payment.Metadata?.PaymentOrderId,
                rawResponse);
        }

        private void ValidateOptions()
        {
            if (string.IsNullOrWhiteSpace(_options.ShopId))
            {
                throw new InvalidOperationException(
                    "YooKassa ShopId is not configured.");
            }

            if (string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                throw new InvalidOperationException(
                    "YooKassa SecretKey is not configured.");
            }

            if (string.IsNullOrWhiteSpace(_options.ReturnUrl))
            {
                throw new InvalidOperationException(
                    "YooKassa ReturnUrl is not configured.");
            }
        }

        private sealed class YooKassaPaymentResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [JsonPropertyName("status")]
            public string Status { get; set; } = string.Empty;

            [JsonPropertyName("paid")]
            public bool Paid { get; set; }

            [JsonPropertyName("confirmation")]
            public YooKassaConfirmation? Confirmation { get; set; }
        }

        private sealed class YooKassaConfirmation
        {
            [JsonPropertyName("confirmation_url")]
            public string? ConfirmationUrl { get; set; }
        }
        private sealed class YooKassaPaymentDetailsResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; } = string.Empty;

            [JsonPropertyName("status")]
            public string Status { get; set; } = string.Empty;

            [JsonPropertyName("paid")]
            public bool Paid { get; set; }

            [JsonPropertyName("amount")]
            public YooKassaAmount? Amount { get; set; }

            [JsonPropertyName("payment_method")]
            public YooKassaPaymentMethod? PaymentMethod { get; set; }

            [JsonPropertyName("metadata")]
            public YooKassaMetadata? Metadata { get; set; }
        }

        private sealed class YooKassaAmount
        {
            [JsonPropertyName("value")]
            public string Value { get; set; } = string.Empty;

            [JsonPropertyName("currency")]
            public string Currency { get; set; } = string.Empty;
        }

        private sealed class YooKassaPaymentMethod
        {
            [JsonPropertyName("id")]
            public string? Id { get; set; }

            [JsonPropertyName("saved")]
            public bool Saved { get; set; }
        }

        private sealed class YooKassaMetadata
        {
            [JsonPropertyName("payment_order_id")]
            public string? PaymentOrderId { get; set; }
        }
    }
}
