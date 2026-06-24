namespace Taro.Api.Billing
{
    public sealed class BillingPortalOptions
    {
        public string BaseUrl { get; set; } = "http://localhost:3000";
        public int AccessTokenMinutes { get; set; } = 120;
    }
}
