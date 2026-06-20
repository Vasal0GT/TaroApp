using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using Taro.Core.Interfaces;
using Taro.Core.Modules.Account.Services;
using Taro.Core.Modules.Auth.Services;

namespace Taro.Core
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddCore(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAccountService, AccountService>();



            return services;
        }
    }
}
