using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using apiroot.Models;

namespace apiroot.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext(options)
{
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Listing> Listings { get; set; }
    public DbSet<Expertise> Expertises { get; set; }
    public DbSet<Review> Reviews { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).IsRequired();
            entity.Property(e => e.UserId).IsRequired();
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
                );
        });

        // Listing configuration
        builder.Entity<Listing>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Expertise)
                .WithOne(e => e.Listing)
                .HasForeignKey<Expertise>(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ListingType);
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.VehicleId);
            entity.HasIndex(e => e.CreatedAt);
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

        // Review configuration
        builder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Reviewer)
                .WithMany()
                .HasForeignKey(e => e.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TargetUser)
                .WithMany()
                .HasForeignKey(e => e.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.TargetUserId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
