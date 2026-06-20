using System;
using System.Collections.Generic;
using System.Text;

namespace Taro.Core.Entities
{
    public sealed class Wallet
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        public int Balance { get; set; }

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
