using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Roski.Api.Persistence;

/// <summary>
/// Loads slope + lift data from a JSON file produced by data/import-slopes-lifts.py.
/// When the file exists for a resort, replaces any existing slopes/lifts with the
/// imported ones — i.e., the JSON is the source of truth.
/// </summary>
public static class SlopesLiftsLoader
{
    public static async Task<bool> TryImportFromJsonAsync(AppDbContext db, Resort resort, CancellationToken ct)
    {
        var jsonPath = FindJsonPath(resort.Slug);
        if (jsonPath is null) return false;

        var json = await File.ReadAllTextAsync(jsonPath, ct);
        var data = JsonSerializer.Deserialize<ImportedDocument>(json, JsonOpts);
        if (data is null) return false;

        // Wipe + re-insert. Re-runs are cheap and predictable.
        var existingSlopes = await db.Slopes.Where(s => s.ResortId == resort.Id).ToListAsync(ct);
        var existingLifts = await db.Lifts.Where(l => l.ResortId == resort.Id).ToListAsync(ct);
        db.Slopes.RemoveRange(existingSlopes);
        db.Lifts.RemoveRange(existingLifts);
        await db.SaveChangesAsync(ct);

        foreach (var s in data.Slopes)
        {
            db.Slopes.Add(new Slope
            {
                Id = Guid.NewGuid(),
                ResortId = resort.Id,
                Name = s.Name,
                Difficulty = s.Difficulty ?? "medium",
                LengthM = s.LengthM,
                IsOpen = s.IsOpen,
                OsmId = s.OsmId,
                Geometry = new GeoLineString(s.Geometry.Coordinates),
            });
        }
        foreach (var l in data.Lifts)
        {
            db.Lifts.Add(new Lift
            {
                Id = Guid.NewGuid(),
                ResortId = resort.Id,
                Name = l.Name,
                LiftType = l.LiftType ?? "drag",
                Capacity = l.Capacity,
                Hours = l.Hours,
                IsOpen = l.IsOpen,
                OsmId = l.OsmId,
                Geometry = new GeoLineString(l.Geometry.Coordinates),
            });
        }
        await db.SaveChangesAsync(ct);

        Console.WriteLine($"[seed] imported {data.Slopes.Count} slopes + {data.Lifts.Count} lifts for '{resort.Slug}' from {jsonPath}");
        return true;
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private static string? FindJsonPath(string slug)
    {
        var candidates = new[]
        {
            Path.Combine("..", "data", "source", $"{slug}-slopes-lifts.json"),
            Path.Combine("data", "source", $"{slug}-slopes-lifts.json"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "data", "source", $"{slug}-slopes-lifts.json"),
        };
        foreach (var p in candidates)
        {
            if (File.Exists(p)) return Path.GetFullPath(p);
        }
        return null;
    }

    private record ImportedDocument(string ResortSlug, List<ImportedSlope> Slopes, List<ImportedLift> Lifts);

    private record ImportedSlope(
        long? OsmId,
        string? Name,
        string? Difficulty,
        int? LengthM,
        bool IsOpen,
        ImportedGeometry Geometry);

    private record ImportedLift(
        long? OsmId,
        string? Name,
        [property: JsonPropertyName("liftType")] string? LiftType,
        int? Capacity,
        string? Hours,
        bool IsOpen,
        ImportedGeometry Geometry);

    private record ImportedGeometry(string Type, double[][] Coordinates);
}
