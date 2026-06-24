using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Entities;

namespace Taro.Core.Interfaces
{
        public interface IAppDbContext
        {
            DbSet<User> Users { get; }

            DbSet<UserSession> UserSessions { get; }

            DbSet<Wallet> Wallets { get; }

            DbSet<WalletTransaction> WalletTransactions { get; }

            DbSet<PaymentOrder> PaymentOrders { get; }

            DbSet<Subscription> Subscriptions { get; }

            DbSet<BillingPortalSession> BillingPortalSessions { get; }

            DbSet<EmailVerificationCode> EmailVerificationCodes { get; }

            DbSet<PasswordResetCode> PasswordResetCodes { get; }

            DbSet<PasswordResetToken> PasswordResetTokens { get; }

            DbSet<ExternalAuthAccount> ExternalAuthAccounts { get; }

            DbSet<TarotReading> TarotReadings { get; }

            Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        }
}
