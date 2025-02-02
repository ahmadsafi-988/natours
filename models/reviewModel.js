const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

// review(text) , rating , createdAt ,ref to tour ,ref to user
// review schema

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "a review must have it's review message"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'the reivew must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'the review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// to prevent a user to create an another review on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numOfRatings: { $sum: 1 },
        avgOfRatings: { $avg: '$rating' },
      },
    },
  ]);

  console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].numOfRatings,
    ratingsAverage: stats[0].avgOfRatings,
  });
};

// for creating and save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// for updating and delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this refers to the query
  // note the review here contains unupdated data
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
