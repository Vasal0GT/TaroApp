using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Entities;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Persistence
{
    public sealed class AppDbContext : DbContext, IAppDbContext
    {
        public DbSet<User> Users => Set<User>();

        public DbSet<UserSession> UserSessions => Set<UserSession>();

        public DbSet<Wallet> Wallets => Set<Wallet>();

        public DbSet<EmailVerificationCode> EmailVerificationCodes => Set<EmailVerificationCode>();
        public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();

        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<ExternalAuthAccount> ExternalAuthAccounts => Set<ExternalAuthAccount>();
        public DbSet<TarotReading> TarotReadings => Set<TarotReading>();


        public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
        public DbSet<PaymentOrder> PaymentOrders => Set<PaymentOrder>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<BillingPortalSession> BillingPortalSessions => Set<BillingPortalSession>();



        public AppDbContext(DbContextOptions<AppDbContext> options)     
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {


                entity.ToTable("users");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.Email)
                    .HasColumnName("email")
                    .HasMaxLength(320)
                    .IsRequired();

                entity.Property(x => x.NormalizedEmail)
                    .HasColumnName("normalized_email")
                    .HasMaxLength(320)
                    .IsRequired();

                entity.HasIndex(x => x.NormalizedEmail)
                    .IsUnique();

                entity.Property(x => x.PasswordHash)
                    .HasColumnName("password_hash")
                    .IsRequired();

                entity.Property(x => x.EmailVerifiedAt)
                    .HasColumnName("email_verified_at");

                entity.Property(x => x.Nickname)
                    .HasColumnName("nickname")
                    .HasMaxLength(32);

                entity.Property(x => x.ZodiacSign)
                    .HasColumnName("zodiac_sign")
                    .HasMaxLength(32);

                entity.Property(x => x.IsOnboardingCompleted)
                    .HasColumnName("is_onboarding_completed")
                    .HasDefaultValue(false);

                entity.Property(x => x.SubscriptionTier)
                    .HasColumnName("subscription_tier")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.SubscriptionExpiresAt)
                    .HasColumnName("subscription_expires_at");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.DeletedAt)
                    .HasColumnName("deleted_at");

                entity.HasOne(x => x.Wallet)
                    .WithOne(x => x.User)
                    .HasForeignKey<Wallet>(x => x.UserId);
            });

            modelBuilder.Entity<UserSession>(entity =>
            {
                entity.ToTable("user_sessions");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.RefreshTokenHash)
                    .HasColumnName("refresh_token_hash")
                    .IsRequired();

                entity.HasIndex(x => x.RefreshTokenHash)
                    .IsUnique();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.RevokedAt)
                    .HasColumnName("revoked_at");

                entity.HasOne(x => x.User)
                    .WithMany(x => x.Sessions)
                    .HasForeignKey(x => x.UserId);
            });

            modelBuilder.Entity<Wallet>(entity =>
            {
                entity.ToTable("wallets");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.HasIndex(x => x.UserId)
                    .IsUnique();

                entity.Property(x => x.Balance)
                    .HasColumnName("balance");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at");
            });

            modelBuilder.Entity<EmailVerificationCode>(entity =>
            {
                entity.ToTable("email_verification_codes");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.CodeHash)
                    .HasColumnName("code_hash")
                    .IsRequired();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.UsedAt)
                    .HasColumnName("used_at");

                entity.Property(x => x.Attempts)
                    .HasColumnName("attempts");

                entity.HasIndex(x => x.UserId);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.EmailVerificationCodes)
                    .HasForeignKey(x => x.UserId);
            });
            modelBuilder.Entity<PasswordResetCode>(entity =>
            {
                entity.ToTable("password_reset_codes");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.CodeHash)
                    .HasColumnName("code_hash")
                    .IsRequired();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.UsedAt)
                    .HasColumnName("used_at");

                entity.Property(x => x.Attempts)
                    .HasColumnName("attempts");

                entity.HasIndex(x => x.UserId);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.PasswordResetCodes)
                    .HasForeignKey(x => x.UserId);
            });

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.ToTable("password_reset_tokens");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.TokenHash)
                    .HasColumnName("token_hash")
                    .IsRequired();

                entity.HasIndex(x => x.TokenHash)
                    .IsUnique();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.UsedAt)
                    .HasColumnName("used_at");

                entity.HasIndex(x => x.UserId);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.PasswordResetTokens)
                    .HasForeignKey(x => x.UserId);
            });

            modelBuilder.Entity<ExternalAuthAccount>(entity =>
            {
                entity.ToTable("external_auth_accounts");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.Provider)
                    .HasColumnName("provider")
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.ProviderUserId)
                    .HasColumnName("provider_user_id")
                    .HasMaxLength(256)
                    .IsRequired();

                entity.Property(x => x.Email)
                    .HasColumnName("email")
                    .HasMaxLength(320);

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.HasIndex(x => new { x.Provider, x.ProviderUserId })
                    .IsUnique();

                entity.HasOne(x => x.User)
                    .WithMany(x => x.ExternalAuthAccounts)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TarotReading>(entity =>
            {
                entity.ToTable("tarot_readings");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id).HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.SpreadSize)
                    .HasColumnName("spread_size")
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.Topic)
                    .HasColumnName("topic")
                    .HasMaxLength(64);

                entity.Property(x => x.Question)
                    .HasColumnName("question")
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasConversion<int>()
                    .IsRequired();

                entity.Property(x => x.CardsJson)
                    .HasColumnName("cards_json")
                    .HasColumnType("jsonb")
                    .IsRequired();

                entity.Property(x => x.ResultJson)
                    .HasColumnName("result_json")
                    .HasColumnType("jsonb");

                entity.Property(x => x.ErrorMessage)
                    .HasColumnName("error_message")
                    .HasMaxLength(2000);

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.StartedAt)
                    .HasColumnName("started_at");

                entity.Property(x => x.CompletedAt)
                    .HasColumnName("completed_at");

                entity.HasIndex(x => x.UserId);
                entity.HasIndex(x => x.Status);
                entity.HasIndex(x => x.CreatedAt);

                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            //
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.ToTable("subscriptions");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.Tier)
                    .HasColumnName("tier")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.PlanCode)
                    .HasColumnName("plan_code")
                    .HasMaxLength(64)
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.StartsAt)
                    .HasColumnName("starts_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.BillingCycleMonths)
                    .HasColumnName("billing_cycle_months");

                entity.Property(x => x.AutoRenewEnabled)
                    .HasColumnName("auto_renew_enabled")
                    .HasDefaultValue(true);

                entity.Property(x => x.NextChargeAt)
                    .HasColumnName("next_charge_at");

                entity.Property(x => x.YooKassaPaymentMethodId)
                    .HasColumnName("yookassa_payment_method_id")
                    .HasMaxLength(128);

                entity.Property(x => x.StarsPerMonth)
                    .HasColumnName("stars_per_month");

                entity.Property(x => x.NextStarsGrantAt)
                    .HasColumnName("next_stars_grant_at");

                entity.Property(x => x.LastStarsGrantAt)
                    .HasColumnName("last_stars_grant_at");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.CanceledAt)
                    .HasColumnName("canceled_at");

                entity.HasIndex(x => x.UserId);

                entity.HasIndex(x => x.Status);

                entity.HasIndex(x => x.ExpiresAt);

                entity.HasIndex(x => x.NextChargeAt);

                entity.HasIndex(x => x.NextStarsGrantAt);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.Subscriptions)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PaymentOrder>(entity =>
            {
                entity.ToTable("payment_orders");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.SubscriptionId)
                    .HasColumnName("subscription_id");

                entity.Property(x => x.ProductCode)
                    .HasColumnName("product_code")
                    .HasMaxLength(64)
                    .IsRequired();

                entity.Property(x => x.Kind)
                    .HasColumnName("kind")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.Amount)
                    .HasColumnName("amount")
                    .HasPrecision(12, 2);

                entity.Property(x => x.Currency)
                    .HasColumnName("currency")
                    .HasMaxLength(3)
                    .IsRequired();

                entity.Property(x => x.IdempotenceKey)
                    .HasColumnName("idempotence_key")
                    .HasMaxLength(64)
                    .IsRequired();

                entity.Property(x => x.YooKassaPaymentId)
                    .HasColumnName("yookassa_payment_id")
                    .HasMaxLength(128);

                entity.Property(x => x.ConfirmationUrl)
                    .HasColumnName("confirmation_url");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.PaidAt)
                    .HasColumnName("paid_at");

                entity.Property(x => x.CanceledAt)
                    .HasColumnName("canceled_at");

                entity.Property(x => x.FailureReason)
                    .HasColumnName("failure_reason")
                    .HasMaxLength(2000);

                entity.Property(x => x.RawProviderPayload)
                    .HasColumnName("raw_provider_payload")
                    .HasColumnType("jsonb");

                entity.HasIndex(x => x.UserId);

                entity.HasIndex(x => x.SubscriptionId);

                entity.HasIndex(x => x.Status);

                entity.HasIndex(x => x.CreatedAt);

                entity.HasIndex(x => x.IdempotenceKey)
                    .IsUnique();

                entity.HasIndex(x => x.YooKassaPaymentId)
                    .IsUnique();

                entity.HasOne(x => x.User)
                    .WithMany(x => x.PaymentOrders)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Subscription)
                    .WithMany(x => x.PaymentOrders)
                    .HasForeignKey(x => x.SubscriptionId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<WalletTransaction>(entity =>
            {
                entity.ToTable("wallet_transactions");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.WalletId)
                    .HasColumnName("wallet_id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.Delta)
                    .HasColumnName("delta");

                entity.Property(x => x.BalanceAfter)
                    .HasColumnName("balance_after");

                entity.Property(x => x.Reason)
                    .HasColumnName("reason")
                    .HasConversion<string>()
                    .HasMaxLength(32)
                    .IsRequired();

                entity.Property(x => x.SourceId)
                    .HasColumnName("source_id");

                entity.Property(x => x.IdempotencyKey)
                    .HasColumnName("idempotency_key")
                    .HasMaxLength(128)
                    .IsRequired();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.HasIndex(x => x.WalletId);

                entity.HasIndex(x => x.UserId);

                entity.HasIndex(x => x.CreatedAt);

                entity.HasIndex(x => x.IdempotencyKey)
                    .IsUnique();

                entity.HasOne(x => x.Wallet)
                    .WithMany(x => x.Transactions)
                    .HasForeignKey(x => x.WalletId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.WalletTransactions)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<BillingPortalSession>(entity =>
            {
                entity.ToTable("billing_portal_sessions");

                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id)
                    .HasColumnName("id");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x => x.TokenHash)
                    .HasColumnName("token_hash")
                    .HasMaxLength(128)
                    .IsRequired();

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(x => x.UsedAt)
                    .HasColumnName("used_at");

                entity.HasIndex(x => x.TokenHash)
                    .IsUnique();

                entity.HasIndex(x => x.ExpiresAt);

                entity.HasOne(x => x.User)
                    .WithMany(x => x.BillingPortalSessions)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
