FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Taro.Api/Taro.Api.csproj", "src/Taro.Api/"]
COPY ["src/Taro.Core/Taro.Core.csproj", "src/Taro.Core/"]
COPY ["src/Taro.Infrastructure/Taro.Infrastructure.csproj", "src/Taro.Infrastructure/"]

RUN dotnet restore "src/Taro.Api/Taro.Api.csproj"

COPY . .

WORKDIR "/src/src/Taro.Api"

RUN dotnet publish "Taro.Api.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Taro.Api.dll"]