const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document Found!!!!', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      // throw new AppError('No Tour Found!!!!', 404);
      return next(new AppError('No document Found!!!!', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

exports.createOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

exports.getOne = function (Model, populateOptions) {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const document = await query;
    if (!document) {
      return next(new AppError('No document Found!!!!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });
};

exports.getAll = function (Model) {
  return catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // BUILD QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const features = Model.find();

    // EXECUTE QUERY
    const documents = await features.query;
    // const documents = await features.query.explain();

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        documents: documents,
      },
    });
  });
};
