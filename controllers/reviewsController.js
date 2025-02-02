const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

// just for debugging
// exports.getAllReviews = catchAsync(async function (req, res, next) {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// exports.getReview = catchAsync(async function (req, res, next) {
//   // getting the id
//   const id = req.params.id;
//   const review = await Review.findById(id);

//   if (!review) {
//     next(new AppError('no review found with this id', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// });

// exports.createReview = catchAsync(async function (req, res, next) {
//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// });
