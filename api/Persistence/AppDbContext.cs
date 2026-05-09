using Microsoft.EntityFrameworkCore;

namespace Roski.Api.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Resort> Resorts => Set<Resort>();
    public DbSet<Slope> Slopes => Set<Slope>();
    public DbSet<Lift> Lifts => Set<Lift>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Resort>(e =>
        {
            e.ToTable("resorts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Slug).HasMaxLength(64);
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Webcams).HasColumnType("jsonb");
        });

        b.Entity<Slope>(e =>
        {
            e.ToTable("slopes");
            e.HasKey(x => x.Id);
            e.HasOne<Resort>().WithMany(r => r.Slopes).HasForeignKey(x => x.ResortId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Geometry).HasColumnType("jsonb");
            e.Property(x => x.Difficulty).HasMaxLength(16);
            e.HasIndex(x => x.ResortId);
            e.HasIndex(x => x.OsmId);
        });

        b.Entity<Lift>(e =>
        {
            e.ToTable("lifts");
            e.HasKey(x => x.Id);
            e.HasOne<Resort>().WithMany(r => r.Lifts).HasForeignKey(x => x.ResortId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Geometry).HasColumnType("jsonb");
            e.Property(x => x.LiftType).HasMaxLength(32);
            e.HasIndex(x => x.ResortId);
            e.HasIndex(x => x.OsmId);
        });
    }
}
