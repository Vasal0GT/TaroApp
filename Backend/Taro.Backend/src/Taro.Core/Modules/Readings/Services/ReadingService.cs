using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Taro.Core.Common;
using Taro.Core.Entities;
using Taro.Core.Enums;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Readings.Dtos;

namespace Taro.Core.Modules.Readings.Services
{
    public sealed class ReadingService : IReadingService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly IAppDbContext _db;
        private readonly IOpenAiTarotClient _openAiTarotClient;

        public ReadingService(IAppDbContext db, IOpenAiTarotClient openAiTarotClient)
        {
            _db = db;
            _openAiTarotClient = openAiTarotClient;
        }

        public async Task<ReadingResponse> CreateAsync(Guid userId, CreateReadingRequest request, CancellationToken cancellationToken = default)
        {
            var question = request.Question.Trim();

            if (string.IsNullOrWhiteSpace(question))
            {
                throw new AppException("Question is required.", 400);
            }

            if (question.Length > 200)
            {
                throw new AppException(
                    "Question must contain no more than 200 characters.", 400);
            }

            ValidateSpreadSize(request.SpreadSize);
            ValidateCards(request.SpreadSize, request.Cards);

            var starsCost = GetStarsCost(request.SpreadSize);

            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (wallet is null)
            {
                throw new AppException("Wallet not found.", 400);
            }

            if (wallet.Balance < starsCost)
            {
                throw new AppException(
                    "Not enough stars to create this reading.",
                    402);
            }

            var now = DateTimeOffset.UtcNow;

            var reading = new TarotReading
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SpreadSize = request.SpreadSize,
                Topic = request.Topic?.Trim(),
                Question = question,
                Status = ReadingStatus.Queued,
                CardsJson = JsonSerializer.Serialize(request.Cards, JsonOptions),
                CreatedAt = now
            };

            _db.TarotReadings.Add(reading);

            wallet.Balance -= starsCost;
            wallet.UpdatedAt = now;

            _db.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                UserId = userId,

                Delta = -starsCost,
                BalanceAfter = wallet.Balance,

                Reason = WalletTransactionReason.ReadingSpend,
                SourceId = reading.Id,

                IdempotencyKey = $"reading-spend:{reading.Id:N}",   
                CreatedAt = now
            });

            // Одним сохранением записываются:
            // 1. TarotReading
            // 2. Новый баланс Wallet
            // 3. WalletTransaction со списанием
            await _db.SaveChangesAsync(cancellationToken);

            return ToResponse(reading);
        }

        public async Task<ReadingResponse> GetAsync(Guid userId, Guid readingId, CancellationToken cancellationToken = default)
        {
            var reading = await _db.TarotReadings.FirstOrDefaultAsync(x => x.Id == readingId && x.UserId == userId, cancellationToken);

            if (reading is null)
                throw new KeyNotFoundException("Reading not found.");

            return ToResponse(reading);
        }

        public async Task ProcessAsync(Guid readingId, CancellationToken cancellationToken = default)
        {
            var reading = await _db.TarotReadings
                .FirstOrDefaultAsync(x => x.Id == readingId, cancellationToken);

            if (reading is null)
                return;

            if (reading.Status is ReadingStatus.Completed or ReadingStatus.Failed)
                return;

            try
            {
                reading.Status = ReadingStatus.Processing;
                reading.StartedAt = DateTimeOffset.UtcNow;
                reading.ErrorMessage = null;

                await _db.SaveChangesAsync(cancellationToken);

                var cards = DeserializeCards(reading.CardsJson);

                var result = await _openAiTarotClient.GenerateReadingAsync(
                    reading.SpreadSize,
                    reading.Topic,
                    reading.Question,
                    cards,
                    cancellationToken);

                reading.ResultJson = JsonSerializer.Serialize(result, JsonOptions);
                reading.Status = ReadingStatus.Completed;
                reading.CompletedAt = DateTimeOffset.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                if (reading is not null)
                {
                    var now = DateTimeOffset.UtcNow;

                    reading.Status = ReadingStatus.Failed;
                    reading.ErrorMessage = TruncateError(ex.Message);
                    reading.CompletedAt = now;

                    await RefundReadingStarsAsync(
                        reading.UserId,
                        reading.Id,
                        reading.SpreadSize,
                        cancellationToken);

                    await _db.SaveChangesAsync(cancellationToken);
                }

                throw;
            }
        }

        private static void ValidateSpreadSize(TarotSpreadSize spreadSize)
        {
            if (spreadSize is not TarotSpreadSize.One
                and not TarotSpreadSize.Three
                and not TarotSpreadSize.Five
                and not TarotSpreadSize.Seven
                and not TarotSpreadSize.Ten)
            {
                throw new AppException("Invalid spread size.", 400);
            }
        }

        private static void ValidateCards(TarotSpreadSize spreadSize, List<SelectedTarotCardDto> cards)
        {
            var expectedCount = (int)spreadSize;

            if (cards.Count != expectedCount)
                throw new AppException($"Expected {expectedCount} cards.", 400);

            var uniqueCardIds = cards.Select(x => x.Id).Distinct().Count();

            if (uniqueCardIds != cards.Count)
                throw new AppException("Cards must be unique.", 400);

            foreach (var card in cards)
            {
                if (card.Id <= 0)
                    throw new AppException("Invalid card id.", 400);

                if (string.IsNullOrWhiteSpace(card.Name))
                    throw new AppException("Card name is required.", 400);
            }
        }

        private static ReadingResponse ToResponse(TarotReading reading)
        {
            return new ReadingResponse
            {
                Id = reading.Id,
                SpreadSize = reading.SpreadSize,
                Topic = reading.Topic,
                Question = reading.Question,
                Status = reading.Status,
                Cards = DeserializeCards(reading.CardsJson),
                Result = string.IsNullOrWhiteSpace(reading.ResultJson)
                    ? null
                    : JsonSerializer.Deserialize<TarotReadingResultDto>(
                        reading.ResultJson,
                        JsonOptions),
                ErrorMessage = reading.ErrorMessage,
                CreatedAt = reading.CreatedAt,
                CompletedAt = reading.CompletedAt
            };
        }

        private static List<SelectedTarotCardDto> DeserializeCards(string cardsJson)
        {
            return JsonSerializer.Deserialize<List<SelectedTarotCardDto>>(
                cardsJson,
                JsonOptions) ?? new List<SelectedTarotCardDto>();
        }

        private static int GetStarsCost(TarotSpreadSize spreadSize)
        {
            return spreadSize switch
            {
                TarotSpreadSize.One => 1,
                TarotSpreadSize.Three => 2,
                TarotSpreadSize.Five => 3,
                TarotSpreadSize.Seven => 4,
                TarotSpreadSize.Ten => 5,

                _ => throw new AppException("Invalid spread size.", 400)
            };
        }

        private async Task RefundReadingStarsAsync(Guid userId, Guid readingId, TarotSpreadSize spreadSize, CancellationToken cancellationToken)
        {
            var refundAlreadyExists = await _db.WalletTransactions
                .AnyAsync(
                    x =>
                        x.SourceId == readingId &&
                        x.Reason == WalletTransactionReason.Refund,
                    cancellationToken);

            if (refundAlreadyExists)
            {
                return;
            }

            var wallet = await _db.Wallets
                .FirstOrDefaultAsync(
                    x => x.UserId == userId,
                    cancellationToken);

            if (wallet is null)
            {
                return;
            }

            var starsCost = GetStarsCost(spreadSize);
            var now = DateTimeOffset.UtcNow;

            wallet.Balance += starsCost;
            wallet.UpdatedAt = now;

            _db.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                UserId = userId,

                Delta = starsCost,
                BalanceAfter = wallet.Balance,

                Reason = WalletTransactionReason.Refund,
                SourceId = readingId,

                IdempotencyKey = $"reading-refund:{readingId:N}",
                CreatedAt = now
            });
        }

        private static string TruncateError(string value)
        {
            const int maxLength = 2000;

            return value.Length <= maxLength
                ? value
                : value[..maxLength];
        }
    }
}
