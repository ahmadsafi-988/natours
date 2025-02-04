const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) get the tours data
  const tours = await Tour.find();
  // 2) build the template
  // 3) render the template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async function (req, res, next) {
  // get the data
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) {
    return next(new AppError("there's no tour with that name", 404));
  }
  // build the template

  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
  });
});

exports.getLogInForm = (req, res) => {
  res.status(200).render('logIn', {
    title: 'log in into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'your Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const toursId = bookings.map((booking) => booking.tour);

  const tours = await Tour.find({ _id: { $in: toursId } });

  res.render('overview', {
    title: 'my tours',
    tours,
  });
});

// we use this when we use URL encoded way of sending a request
// exports.updateUser = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     },
//   );
//   res.status(200).render('account', {
//     title: 'your Account',
//     user: updatedUser,
//   });
// });
