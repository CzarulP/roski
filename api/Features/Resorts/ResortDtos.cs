using Roski.Api.Persistence;

namespace Roski.Api.Features.Resorts;

public record ResortSummaryDto(
    Guid Id,
    string Slug,
    string Name,
    string Region,
    int? ElevationMin,
    int? ElevationMax,
    double CenterLat,
    double CenterLon,
    string? PreviewImageUrl,
    int OpenSlopes,
    int OpenLifts);

public record ResortDetailDto(
    Guid Id,
    string Slug,
    string Name,
    string Region,
    string? Description,
    int? ElevationMin,
    int? ElevationMax,
    double CenterLat,
    double CenterLon,
    double TerrainOriginLat,
    double TerrainOriginLon,
    string? TerrainModelUrl,
    string? PreviewImageUrl,
    string? WebsiteUrl,
    List<WebcamLink> Webcams,
    int OpenSlopes,
    int OpenLifts,
    int TotalSlopes,
    int TotalLifts);
