using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Readings.Services;
using Taro.Infrastructure.AI;
using Taro.Infrastructure.Auth;
using Taro.Infrastructure.Email;
using Taro.Infrastructure.Persistence;
using Taro.Core.Modules.Billing.Services;
using Taro.Infrastructure.Payments.YooKassa;

namespace Taro.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("Postgres");

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
            });

            services.AddScoped<IAppDbContext>(provider =>
                provider.GetRequiredService<AppDbContext>());

            services.Configure<MailOptions>(
                configuration.GetSection("Mail"));

            services.AddScoped<IEmailSender, SmtpEmailSender>();
            services.AddScoped<IEmailCodeGenerator, EmailCodeGenerator>();

            services.Configure<JwtOptions>(
                configuration.GetSection("Jwt"));

            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<IRefreshTokenGenerator, RefreshTokenGenerator>();
            services.AddScoped<IRefreshTokenHasher, RefreshTokenHasher>();

            services.Configure<ExternalAuthOptions>(
                configuration.GetSection("ExternalAuth"));

            services.AddScoped<IExternalAuthTokenValidator, ExternalAuthTokenValidator>();

            services.AddScoped<IReadingService, ReadingService>();
            services.AddScoped<IBillingService, BillingService>();

            services.Configure<OpenAiOptions>(configuration.GetSection("OpenAI"));

            services.Configure<YooKassaOptions>(configuration.GetSection("YooKassa"));
            services.AddHttpClient<IYooKassaClient, YooKassaClient>(client =>
            {
                client.BaseAddress = new Uri("https://api.yookassa.ru/");
                client.Timeout = TimeSpan.FromSeconds(30);
            });

            services.AddHttpClient<IOpenAiTarotClient, OpenAiTarotClient>();

            return services;
        }
    }
}