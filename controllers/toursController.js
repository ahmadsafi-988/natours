const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// we are gonna make a middleware to adjust on the request query to get the best and cheapset 5 tours

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image , please upload only images !! '), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

exports.aliasTopTours = function (req, res, next) {
  // applying pagination
  req.query.limit = '5';
  // applying sort
  req.query.sort = '-ratingsAverage,price';
  // applying limiting fields or SELECTION
  req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
  // applying filtring
  req.query.price = { $gte: 1000 };
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
    // {
    //   $sort: { minPrice: -1 },
    // },
  ]).sort('-minPrice');

  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

// first we need to unwind the whole documents based on the startDates field
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        num: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $limit: 7,
    },
  ]);

  res.status(200).json({
    status: 'suceess',
    results: plan.length,
    plan: {
      plan,
    },
  });
});

// router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(toursController.getToursWithin);
exports.getToursWithin = catchAsync(async function (req, res, next) {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  console.log(distance, lat, lng, unit);

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat | !lng) {
    return next(new AppError('please provide latitude and longitude !!', 400));
  }

  // { $centerSphere: [ [ <x>, <y> ], <radius> ] }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    length: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async function (req, res, next) {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

  if (!lat | !lng) {
    return next(new AppError('please provide latitude and longitude !!', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

//33.970869,-118.179627

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // tour.anyfunction() always returns a query but if we use exec() or await or then it's gonna to a promise
//   // BUILD QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   // EXECUTE QUERY
//   const tours = await features.query;

//   // 2)
//   // const tours = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   res.status(200).json({
//     status: 'success',
//     requestedTime: req.requestedTime,
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

// to get rid of try and catch block

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // findById() === findOne({})
//   if (!tour) {
//     // throw new AppError('No Tour Found!!!!', 404);
//     return next(new AppError('No Tour Found!!!!', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     requestedTime: req.requestedTime,
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     // throw new AppError('No Tour Found!!!!', 404);
//     return next(new AppError('No Tour Found!!!!', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     // throw new AppError('No Tour Found!!!!', 404);
//     return next(new AppError('No Tour Found!!!!', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
//   // data validation
// });

// i want you to write function that calc the following :
// 1. all of the documents have a ratingAverage more than 4.5 (done)
// 2. calc the num of all documents
// 3. calc the numRatings of all documents
// 4. calc the average Rating of all documents
// 5. calc the average price of all documents
// 5. calc the max price of all documents
// 6. calc the min price of all documents
// 7. group  all documents by diffuclty
// 8. exclude the documents that it's diffculty = easy
// 9. make the diffulty looks in the upper case form
// 10 sort them by price
