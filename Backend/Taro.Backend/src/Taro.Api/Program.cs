using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Taro.Api.Billing;
using Taro.Api.Middleware;
using Taro.Core;
using Taro.Infrastructure;
using Taro.Infrastructure.Auth;
using Taro.Infrastructure.Persistence;


namespace Taro.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Values
                        .SelectMany(value => value.Errors)
                        .Select(error => error.ErrorMessage)
                        .ToArray();

                    return new BadRequestObjectResult(new
                    {
                        error = "Validation failed.",
                        errors
                    });
                };
            });

            builder.Services.AddCore();
            builder.Services.AddInfrastructure(builder.Configuration);
            builder.Services.AddDataProtection().SetApplicationName("Taro.Api");
            builder.Services.Configure<BillingPortalOptions>(builder.Configuration.GetSection("BillingPortal"));
            builder.Services.AddSingleton<BillingPortalAccessTokenService>();
            builder.Services.AddMassTransit(x =>
            {
                x.UsingRabbitMq((context, cfg) =>
                {
                    var rabbitHost =
                        builder.Configuration["RabbitMQ:Host"] ?? "localhost";

                    var rabbitUsername =
                        builder.Configuration["RabbitMQ:Username"] ?? "guest";

                    var rabbitPassword =
                        builder.Configuration["RabbitMQ:Password"] ?? "guest";

                    cfg.Host(rabbitHost, "/", h =>
                    {
                        h.Username(rabbitUsername);
                        h.Password(rabbitPassword);
                    });
                });
            });


            var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>();

            if (jwtOptions is null || string.IsNullOrWhiteSpace(jwtOptions.Secret))
            {
                throw new InvalidOperationException("Jwt options are not configured.");
            }

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtOptions.Issuer,

                        ValidateAudience = true,
                        ValidAudience = jwtOptions.Audience,

                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),

                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromSeconds(30)
                    };
            });

            builder.Services.AddAuthorization();

            builder.Services.AddEndpointsApiExplorer();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.Migrate();
            }

            app.UseMiddleware<ExceptionMiddleware>();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
