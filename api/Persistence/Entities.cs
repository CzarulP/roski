namespace Roski.Api.Persistence;

public class Resort
{
    public Guid Id { get; set; }
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public required string Region { get; set; }
    public string? Description { get; set; }
    public int? ElevationMin { get; set; }
    public int? ElevationMax { get; set; }
    public double CenterLat { get; set; }
    public double CenterLon { get; set; }
    public double TerrainOriginLat { get; set; }
    public double TerrainOriginLon { get; set; }
    public string? TerrainModelUrl { get; set; }
    public string? PreviewImageUrl { get; set; }
    public string? WebsiteUrl { get; set; }
    public List<WebcamLink> Webcams { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Slope> Slopes { get; set; } = new();
    public List<Lift> Lifts { get; set; } = new();
}

public record WebcamLink(string Name, string Url, string Type);

public class Slope
{
    public Guid Id { get; set; }
    public Guid ResortId { get; set; }
    public string? Name { get; set; }
    public required string Difficulty { get; set; }
    public int? LengthM { get; set; }
    public required GeoLineString Geometry { get; set; }
    public bool IsOpen { get; set; } = true;
    public long? OsmId { get; set; }
}

public class Lift
{
    public Guid Id { get; set; }
    public Guid ResortId { get; set; }
    public string? Name { get; set; }
    public required string LiftType { get; set; }
    public int? Capacity { get; set; }
    public string? Hours { get; set; }
    public required GeoLineString Geometry { get; set; }
    public bool IsOpen { get; set; } = true;
    public long? OsmId { get; set; }
}

public record GeoLineString(double[][] Coordinates)
{
    public string Type => "LineString";
}
