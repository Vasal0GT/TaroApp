using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Interfaces;
using Taro.Infrastructure.Auth;
using Taro.Infrastructure.Email;
using Taro.Infrastructure.Persistence;
using Taro.Core.Interfaces;
using Taro.Infrastructure.Auth;


namespace Taro.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("Postgres");

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
            });

            services.Configure<MailOptions>(configuration.GetSection("Mail"));
            services.AddScoped<IEmailSender, SmtpEmailSender>();
            services.AddScoped<IEmailCodeGenerator, EmailCodeGenerator>();

            services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

            services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

            services.Configure<ExternalAuthOptions>(configuration.GetSection("ExternalAuth"));
            services.AddScoped<IExternalAuthTokenValidator, ExternalAuthTokenValidator>();

            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<IRefreshTokenGenerator, RefreshTokenGenerator>();
            services.AddScoped<IRefreshTokenHasher, RefreshTokenHasher>();

            return services;
        }
    }
}
