using Microsoft.EntityFrameworkCore;

namespace Roski.Api.Persistence;

public static class Seed
{
    public static async Task RunAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Resorts.AnyAsync(ct)) return;

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
            WebsiteUrl = "https://www.partiastraja.ro",
            Webcams = new List<WebcamLink>
            {
                new("Vârful Straja", "https://www.partiastraja.ro", "iframe")
            }
        };

        db.Resorts.Add(straja);
        await db.SaveChangesAsync(ct);
    }
}
