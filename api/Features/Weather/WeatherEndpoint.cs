using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Roski.Api.Persistence;
using System.Text.Json.Serialization;

namespace Roski.Api.Features.Weather;

public record WeatherDto(
    double TempC,
    double WindKph,
    double WindDir,
    double SnowfallCm,
    int WeatherCode,
    DateTime ObservedAt);

public static class WeatherEndpoint
{
    public static void MapWeatherEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/resorts/{slug}/weather",
            async (string slug, AppDbContext db, IHttpClientFactory http, IMemoryCache cache, CancellationToken ct) =>
        {
            var resort = await db.Resorts.AsNoTracking()
                .Where(r => r.Slug == slug)
                .Select(r => new { r.CenterLat, r.CenterLon, r.ElevationMax })
                .FirstOrDefaultAsync(ct);

            if (resort is null) return Results.NotFound();

            var cacheKey = $"weather:{slug}";
            if (cache.TryGetValue<WeatherDto>(cacheKey, out var cached) && cached is not null)
                return Results.Ok(cached);

            // Use top elevation if available, else center.
            var lat = resort.CenterLat;
            var lon = resort.CenterLon;
            var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}" +
                      "&current=temperature_2m,wind_speed_10m,wind_direction_10m,snowfall,weather_code" +
                      "&wind_speed_unit=kmh&timezone=Europe%2FBucharest";

            var client = http.CreateClient();
            var resp = await client.GetFromJsonAsync<OpenMeteoResponse>(url, ct);
            if (resp?.Current is null) return Results.Problem("Weather provider error.");

            var dto = new WeatherDto(
                resp.Current.Temperature2m,
                resp.Current.WindSpeed10m,
                resp.Current.WindDirection10m,
                resp.Current.Snowfall,
                resp.Current.WeatherCode,
                DateTime.UtcNow);

            cache.Set(cacheKey, dto, TimeSpan.FromMinutes(15));
            return Results.Ok(dto);
        });
    }

    private record OpenMeteoResponse([property: JsonPropertyName("current")] OpenMeteoCurrent? Current);
    private record OpenMeteoCurrent(
        [property: JsonPropertyName("temperature_2m")] double Temperature2m,
        [property: JsonPropertyName("wind_speed_10m")] double WindSpeed10m,
        [property: JsonPropertyName("wind_direction_10m")] double WindDirection10m,
        [property: JsonPropertyName("snowfall")] double Snowfall,
        [property: JsonPropertyName("weather_code")] int WeatherCode);
}
