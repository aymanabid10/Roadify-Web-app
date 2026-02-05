using apiroot.Data.Mongo.Documents;
using apiroot.Models;
using MongoDB.Driver;

namespace apiroot.Data.Mongo.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly IMongoCollection<ReviewDocument> _collection;

    public ReviewRepository(MongoDbContext context)
    {
        _collection = context.Reviews;
    }

    public async Task<Review?> GetByIdAsync(string id)
    {
        var doc = await _collection.Find(r => r.Id == id).FirstOrDefaultAsync();
        return doc == null ? null : MapToModel(doc);
    }

    public async Task AddAsync(Review review)
    {
        var doc = new ReviewDocument
        {
            ReviewerId = review.ReviewerId,
            TargetUserId = review.TargetUserId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = DateTime.UtcNow,
            IsVisible = true,
            Id = null
        };

        await _collection.InsertOneAsync(doc);
    }

    public async Task UpdateAsync(string id, Review review)
    {
        var update = Builders<ReviewDocument>.Update
            .Set(r => r.Rating, review.Rating)
            .Set(r => r.Comment, review.Comment);

        await _collection.UpdateOneAsync(r => r.Id == id, update);
    }

    public async Task DeleteAsync(string id)
    {
        await _collection.DeleteOneAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Review>> GetByTargetUserIdAsync(Guid userId)
    {
        var docs = await _collection
            .Find(r => r.TargetUserId == userId && r.IsVisible)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

        return docs.Select(MapToModel);
    }

    public async Task<IEnumerable<Review>> GetByReviewerIdAsync(Guid userId)
    {
        var docs = await _collection
            .Find(r => r.ReviewerId == userId)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

        return docs.Select(MapToModel);
    }

    public async Task<double> GetAverageRatingAsync(Guid userId)
    {
        var result = await _collection
            .Aggregate()
            .Match(r => r.TargetUserId == userId)
            .Group(_ => 1, g => new { Avg = g.Average(x => x.Rating) })
            .FirstOrDefaultAsync();

        return result?.Avg ?? 0.0;
    }

    public async Task SoftDeleteByUserIdAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var update = Builders<ReviewDocument>.Update
            .Set(r => r.IsVisible, false);

        await _collection.UpdateManyAsync(
            r => r.ReviewerId == userGuid || r.TargetUserId == userGuid,
            update);
    }

    public async Task RestoreByUserIdAsync(string userId)
    {
        var userGuid = Guid.Parse(userId);
        var update = Builders<ReviewDocument>.Update
            .Set(r => r.IsVisible, true);

        await _collection.UpdateManyAsync(
            r => r.ReviewerId == userGuid || r.TargetUserId == userGuid,
            update);
    }

    private static Review MapToModel(ReviewDocument d) => new Review
    {
        ReviewerId = d.ReviewerId,
        TargetUserId = d.TargetUserId,
        Rating = d.Rating,
        Comment = d.Comment,
        CreatedAt = d.CreatedAt
    };
}