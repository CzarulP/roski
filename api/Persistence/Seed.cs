using Microsoft.EntityFrameworkCore;

namespace Roski.Api.Persistence;

public static class Seed
{
    public static async Task RunAsync(AppDbContext db, CancellationToken ct = default)
    {
        Resort? straja;
        if (await db.Resorts.AnyAsync(ct))
        {
            straja = await db.Resorts.FirstOrDefaultAsync(r => r.Slug == "straja", ct);
        }
        else
        {
            straja = await SeedStrajaResort(db, ct);
        }

        // Always try to refresh slopes/lifts from the imported JSON if available.
        // Falls back to hardcoded test data only if no JSON file is present.
        if (straja is not null)
        {
            var imported = await SlopesLiftsLoader.TryImportFromJsonAsync(db, straja, ct);
            if (!imported && !await db.Slopes.AnyAsync(s => s.ResortId == straja.Id, ct))
            {
                await SeedStrajaTestData(db, straja.Id, ct);
            }
        }
    }

    private static async Task<Resort> SeedStrajaResort(AppDbContext db, CancellationToken ct)
    {
        var straja = new Resort
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Slug = "straja",
            Name = "Straja",
            Region = "Hunedoara",
            Description = "Stațiunea Straja este situată în Munții Vâlcan, deasupra orașului Lupeni, " +
                          "în județul Hunedoara. Cu pârtii între 1.100 și 1.870 m altitudine, oferă " +
                          "una dintre cele mai lungi sezoane de schi din România.",
            ElevationMin = 1100,
            ElevationMax = 1870,
            CenterLat = 45.3146,
            CenterLon = 23.2501,
            TerrainOriginLat = 45.3146,
            TerrainOriginLon = 23.2501,
            TerrainModelUrl = "/terrain/straja.glb",
            PreviewImageUrl = "/images/straja-preview.jpg",
            WebsiteUrl = "https://skistraja.ro/",
            Webcams = new List<WebcamLink>
            {
                new("Vârful Straja", "https://www.partiastraja.ro", "iframe")
            }
        };

        db.Resorts.Add(straja);
        await db.SaveChangesAsync(ct);
        return straja;
    }

    /// <summary>
    /// Phase 2e — hardcoded representative slope + lift to validate the
    /// end-to-end coordinate pipeline. Replaced by the real OSM importer in Phase 3.
    /// Coordinates are [lon, lat, elev_metres_above_sea_level].
    /// </summary>
    private static async Task SeedStrajaTestData(AppDbContext db, Guid resortId, CancellationToken ct)
    {
        // Telecabina Vârful Straja — user-provided endpoint coordinates.
        var lift = new Lift
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ResortId = resortId,
            Name = "Telecabina Vârful Straja",
            LiftType = "cable_car",
            Capacity = 100,
            Hours = "08:30-16:30",
            IsOpen = true,
            Geometry = new GeoLineString(new[]
            {
                new[] { 23.23630, 45.32113, 1100.0 }, // base village / Cabana Straja
                new[] { 23.26386, 45.30807, 1860.0 }, // Vârful Straja summit
            }),
        };

        // Pârtia Constantinescu — a representative slope descending NW from
        // near the summit. Coordinates approximated; Phase 3 imports real OSM ways.
        var slope = new Slope
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ResortId = resortId,
            Name = "Constantinescu",
            Difficulty = "medium",
            LengthM = 2100,
            IsOpen = true,
            Geometry = new GeoLineString(new[]
            {
                new[] { 23.26200, 45.30900, 1820.0 }, // near the top station
                new[] { 23.25500, 45.31200, 1650.0 },
                new[] { 23.25000, 45.31500, 1500.0 }, // mid-mountain saddle
                new[] { 23.24500, 45.31800, 1330.0 },
                new[] { 23.24000, 45.32000, 1150.0 }, // base area
            }),
        };

        db.Lifts.Add(lift);
        db.Slopes.Add(slope);
        await db.SaveChangesAsync(ct);
    }
}
