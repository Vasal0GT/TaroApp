using System;
using System.Collections.Generic;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Taro.Core.Entities;
using Taro.Core.Interfaces;

namespace Taro.Infrastructure.Auth
{
    public sealed class JwtTokenService : IJwtTokenService
    {
        private readonly JwtOptions _options;

        public JwtTokenService(IOptions<JwtOptions> options)
        {
            _options = options.Value;
        }

        public string CreateAccessToken(User user, UserSession session)
        {
            var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("session_id", session.Id.ToString()),
            new("subscription_tier", user.SubscriptionTier.ToString())
        };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);

            var token = new JwtSecurityToken(
                issuer: _options.Issuer,
                audience: _options.Audience,
                claims: claims,
                expires: expires,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
