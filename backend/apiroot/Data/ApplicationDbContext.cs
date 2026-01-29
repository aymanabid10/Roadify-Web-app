using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using apiroot.Models;

namespace apiroot.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext(options)
{
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Media> Media { get; set; }
    public DbSet<Listing> Listings { get; set; }
    public DbSet<Expertise> Expertises { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).IsRequired();
            entity.Property(e => e.UserId).IsRequired();
            
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .HasColumnType("xid")
                .HasColumnName("xmin");
        });

        builder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(e => e.RegistrationNumber).IsUnique();
            entity.Property(e => e.Brand).IsRequired();
            entity.Property(e => e.Model).IsRequired();
            entity.Property(e => e.Year).IsRequired();
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.PhotoUrls)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                )
                .Metadata.SetValueComparer(
                    new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
                        (c1, c2) => c1.SequenceEqual(c2),
                        c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                        c => c.ToList()
                    )
                );
        });

        builder.Entity<Media>(entity =>
        {
            entity.HasIndex(e => e.VehicleId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsDeleted);
            entity.Property(e => e.Url).IsRequired();
            entity.Property(e => e.Type).IsRequired();
          
            entity.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
  
        // Listing configuration - Table-Per-Hierarchy (TPH) inheritance
        builder.Entity<Listing>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Configure TPH inheritance with discriminator column
            entity.HasDiscriminator<string>("ListingType")
                .HasValue<SaleListing>("SALE")
                .HasValue<RentListing>("RENT");
            
            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
          
            entity.HasOne(e => e.Expertise)
                .WithOne(e => e.Listing)
                .HasForeignKey<Expertise>(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Features as JSON column
            entity.Property(e => e.Features)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                );

            // Indexes for performance
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.VehicleId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // SaleListing specific configuration
        builder.Entity<SaleListing>(entity =>
        {
            // No additional configuration needed, inherits from Listing
        });

        // RentListing specific configuration
        builder.Entity<RentListing>(entity =>
        {
            entity.Property(e => e.SecurityDeposit).IsRequired();
            entity.Property(e => e.MinimumRentalPeriod).IsRequired();
        });

        // Expertise configuration
        builder.Entity<Expertise>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Expert)
                .WithMany()
                .HasForeignKey(e => e.ExpertId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
