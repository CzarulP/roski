using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Roski.Api.Persistence;

#nullable disable

namespace Roski.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "resorts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ElevationMin = table.Column<int>(type: "integer", nullable: true),
                    ElevationMax = table.Column<int>(type: "integer", nullable: true),
                    CenterLat = table.Column<double>(type: "double precision", nullable: false),
                    CenterLon = table.Column<double>(type: "double precision", nullable: false),
                    TerrainOriginLat = table.Column<double>(type: "double precision", nullable: false),
                    TerrainOriginLon = table.Column<double>(type: "double precision", nullable: false),
                    TerrainModelUrl = table.Column<string>(type: "text", nullable: true),
                    PreviewImageUrl = table.Column<string>(type: "text", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "text", nullable: true),
                    Webcams = table.Column<List<WebcamLink>>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resorts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "lifts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResortId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    LiftType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    Hours = table.Column<string>(type: "text", nullable: true),
                    Geometry = table.Column<GeoLineString>(type: "jsonb", nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    OsmId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lifts_resorts_ResortId",
                        column: x => x.ResortId,
                        principalTable: "resorts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "slopes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResortId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Difficulty = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    LengthM = table.Column<int>(type: "integer", nullable: true),
                    Geometry = table.Column<GeoLineString>(type: "jsonb", nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    OsmId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_slopes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_slopes_resorts_ResortId",
                        column: x => x.ResortId,
                        principalTable: "resorts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_lifts_OsmId",
                table: "lifts",
                column: "OsmId");

            migrationBuilder.CreateIndex(
                name: "IX_lifts_ResortId",
                table: "lifts",
                column: "ResortId");

            migrationBuilder.CreateIndex(
                name: "IX_resorts_Slug",
                table: "resorts",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_slopes_OsmId",
                table: "slopes",
                column: "OsmId");

            migrationBuilder.CreateIndex(
                name: "IX_slopes_ResortId",
                table: "slopes",
                column: "ResortId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lifts");

            migrationBuilder.DropTable(
                name: "slopes");

            migrationBuilder.DropTable(
                name: "resorts");
        }
    }
}
