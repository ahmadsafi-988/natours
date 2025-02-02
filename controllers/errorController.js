/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-object-spread */
// NOTE : when we are in production mode and an error happens of course we will not send a message
// that conatins a lot of data about the error to the client but when we are in developement mode
// we want a full-detailed message

const AppError = require('../utils/appError');

const handleCastErrorDB = function (err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleUniqueErrorDB = function (err) {
  const message = `Duplicate field value "${err.keyValue.name}" ,please use another one`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = function (err) {
  const errors = Object.values(err.errors).map((field) => field.message);
  const message = `error input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError('invalid token , please log in again', 401);

const handleExpiredJwtError = () =>
  new AppError('expired token , please log in again', 401);

const sendErrorsDev = function (err, req, res) {
  // A) Api error
  if (req.originalUrl.startsWith('/api')) {
    // const errorCopy = Object.assign({}, err);
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      // errorCopy: errorCopy,
      message: err.message,
      stack: err.stack,
    });
    // rendered error
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorsProd = function (err, req, res) {
  // check isOpertional property
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('ERROR!!!');

      // generic message
      res.status(500).json({
        status: 'Error',
        message: 'something went wrong!!',
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong !',
        msg: err.message,
      });
    } else {
      console.error('ERROR!!!');
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong !',
        msg: 'please try again later !',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorsDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let errorCopy = Object.assign({}, err);
    errorCopy.name = err.name;
    errorCopy.message = err.message;

    if (errorCopy.name === 'CastError')
      errorCopy = handleCastErrorDB(errorCopy);
    if (errorCopy.code === 11000) errorCopy = handleUniqueErrorDB(errorCopy);
    if (errorCopy.name === 'ValidationError')
      errorCopy = handleValidationErrorDB(errorCopy);
    if (errorCopy.name === 'JsonWebTokenError') errorCopy = handleJwtError();
    if (errorCopy.name === 'TokenExpiredError')
      errorCopy = handleExpiredJwtError();

    sendErrorsProd(errorCopy, req, res);
  }
};
