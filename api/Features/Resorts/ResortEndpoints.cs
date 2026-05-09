using Microsoft.EntityFrameworkCore;
using Roski.Api.Persistence;

namespace Roski.Api.Features.Resorts;

public static class ResortEndpoints
{
    public static void MapResortEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/resorts").WithTags("Resorts");

        group.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
        {
            var resorts = await db.Resorts
                .AsNoTracking()
                .Select(r => new ResortSummaryDto(
                    r.Id, r.Slug, r.Name, r.Region,
                    r.ElevationMin, r.ElevationMax,
                    r.CenterLat, r.CenterLon,
                    r.PreviewImageUrl,
                    r.Slopes.Count(s => s.IsOpen),
                    r.Lifts.Count(l => l.IsOpen)))
                .ToListAsync(ct);

            return Results.Ok(resorts);
        });

        group.MapGet("/{slug}", async (string slug, AppDbContext db, CancellationToken ct) =>
        {
            var r = await db.Resorts
                .AsNoTracking()
                .Where(x => x.Slug == slug)
                .Select(r => new ResortDetailDto(
                    r.Id, r.Slug, r.Name, r.Region, r.Description,
                    r.ElevationMin, r.ElevationMax,
                    r.CenterLat, r.CenterLon,
                    r.TerrainOriginLat, r.TerrainOriginLon,
                    r.TerrainModelUrl, r.PreviewImageUrl, r.WebsiteUrl,
                    r.Webcams,
                    r.Slopes.Count(s => s.IsOpen),
                    r.Lifts.Count(l => l.IsOpen),
                    r.Slopes.Count(),
                    r.Lifts.Count()))
                .FirstOrDefaultAsync(ct);

            return r is null ? Results.NotFound() : Results.Ok(r);
        });
    }
}
