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
        }
    }
}
