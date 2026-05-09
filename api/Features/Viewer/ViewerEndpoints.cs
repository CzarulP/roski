using Microsoft.EntityFrameworkCore;
using Roski.Api.Persistence;

namespace Roski.Api.Features.Viewer;

public record ViewerSlopeDto(Guid Id, string? Name, string Difficulty, int? LengthM, double[][] Points, bool IsOpen);
public record ViewerLiftDto(Guid Id, string? Name, string LiftType, int? Capacity, string? Hours, double[][] Points, bool IsOpen);

public record ViewerDataDto(
    string ResortSlug,
    double OriginLat,
    double OriginLon,
    string? TerrainModelUrl,
    List<ViewerSlopeDto> Slopes,
    List<ViewerLiftDto> Lifts);

public static class ViewerEndpoints
{
    public static void MapViewerEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/resorts/{slug}/viewer-data",
            async (string slug, AppDbContext db, CancellationToken ct) =>
        {
            var resort = await db.Resorts.AsNoTracking()
                .Where(r => r.Slug == slug)
                .Select(r => new
                {
                    r.Id, r.Slug,
                    r.TerrainOriginLat, r.TerrainOriginLon, r.TerrainModelUrl
                })
                .FirstOrDefaultAsync(ct);

            if (resort is null) return Results.NotFound();

            var slopes = await db.Slopes.AsNoTracking()
                .Where(s => s.ResortId == resort.Id)
                .Select(s => new ViewerSlopeDto(
                    s.Id, s.Name, s.Difficulty, s.LengthM,
                    GeoToLocal(s.Geometry.Coordinates, resort.TerrainOriginLat, resort.TerrainOriginLon),
                    s.IsOpen))
                .ToListAsync(ct);

            var lifts = await db.Lifts.AsNoTracking()
                .Where(l => l.ResortId == resort.Id)
                .Select(l => new ViewerLiftDto(
                    l.Id, l.Name, l.LiftType, l.Capacity, l.Hours,
                    GeoToLocal(l.Geometry.Coordinates, resort.TerrainOriginLat, resort.TerrainOriginLon),
                    l.IsOpen))
                .ToListAsync(ct);

            return Results.Ok(new ViewerDataDto(
                resort.Slug,
                resort.TerrainOriginLat, resort.TerrainOriginLon,
                resort.TerrainModelUrl,
                slopes, lifts));
        });
    }

    // Convert [lon, lat, elev] WGS84 coords to local [x_east_m, y_up_m, z_south_m]
    // around a resort origin. Three.js convention: Y-up, X-east, Z-south (right-handed, north -> -Z).
    private const double EarthRadiusM = 6_378_137.0;
    private static double[][] GeoToLocal(double[][] coords, double originLat, double originLon)
    {
        if (coords is null || coords.Length == 0) return Array.Empty<double[]>();
        var latRad = originLat * Math.PI / 180.0;
        var mPerDegLat = Math.PI * EarthRadiusM / 180.0;
        var mPerDegLon = mPerDegLat * Math.Cos(latRad);

        var result = new double[coords.Length][];
        for (int i = 0; i < coords.Length; i++)
        {
            var lon = coords[i][0];
            var lat = coords[i][1];
            var elev = coords[i].Length > 2 ? coords[i][2] : 0.0;

            var x = (lon - originLon) * mPerDegLon;          // east
            var z = -(lat - originLat) * mPerDegLat;         // north -> -z
            result[i] = [x, elev, z];
        }
        return result;
    }
}
