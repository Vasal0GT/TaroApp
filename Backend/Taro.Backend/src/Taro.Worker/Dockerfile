FROM mcr.microsoft.com/dotnet/runtime:10.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Taro.Worker/Taro.Worker.csproj", "src/Taro.Worker/"]
COPY ["src/Taro.Core/Taro.Core.csproj", "src/Taro.Core/"]
COPY ["src/Taro.Infrastructure/Taro.Infrastructure.csproj", "src/Taro.Infrastructure/"]

RUN dotnet restore "src/Taro.Worker/Taro.Worker.csproj"

COPY . .

WORKDIR "/src/src/Taro.Worker"

RUN dotnet publish "Taro.Worker.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Taro.Worker.dll"]