class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // To distinguish between the programming errors and operational errors
    this.isOperational = true;

    // we use this method to filter out the conctructor call from the stack trace
    // we use stack traec to help us where the error happens
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
