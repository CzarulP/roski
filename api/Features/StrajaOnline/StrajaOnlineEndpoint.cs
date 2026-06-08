using System.Text.Json;

namespace Roski.Api.Features.StrajaOnline;

/// <summary>
/// Serves the crawled strajaonline.ro data (skipass pricing, accommodations,
/// rentals). The crawler writes a JSON file; we cache it in memory and re-read
/// every 5 minutes so a fresh crawl shows up without an API restart.
/// </summary>
public static class StrajaOnlineEndpoint
{
    private static (DateTime loadedAt, byte[] payload)? _cache;
    private static readonly TimeSpan TTL = TimeSpan.FromMinutes(5);
    private static readonly SemaphoreSlim _gate = new(1, 1);

    public static void MapStrajaOnlineEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/resorts/{slug}/external", async (string slug, CancellationToken ct) =>
        {
            if (!string.Equals(slug, "straja", StringComparison.OrdinalIgnoreCase))
                return Results.NotFound();

            var payload = await LoadAsync(ct);
            if (payload is null) return Results.NotFound();

            return Results.Content(System.Text.Encoding.UTF8.GetString(payload), "application/json");
        });
    }

    private static async Task<byte[]?> LoadAsync(CancellationToken ct)
    {
        if (_cache is { } cur && DateTime.UtcNow - cur.loadedAt < TTL)
            return cur.payload;

        await _gate.WaitAsync(ct);
        try
        {
            if (_cache is { } again && DateTime.UtcNow - again.loadedAt < TTL)
                return again.payload;

            var path = FindJsonPath();
            if (path is null) return null;

            var bytes = await File.ReadAllBytesAsync(path, ct);
            _cache = (DateTime.UtcNow, bytes);
            return bytes;
        }
        finally
        {
            _gate.Release();
        }
    }

    private static string? FindJsonPath()
    {
        var candidates = new[]
        {
            Path.Combine("..", "data", "source", "strajaonline.json"),
            Path.Combine("data", "source", "strajaonline.json"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "data", "source", "strajaonline.json"),
        };
        foreach (var p in candidates)
            if (File.Exists(p)) return Path.GetFullPath(p);
        return null;
    }
}
