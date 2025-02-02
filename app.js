const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./dev-data/routes/tourRoutes');
const userRouter = require('./dev-data/routes/userRoutes');
const reviewRouter = require('./dev-data/routes/reviewRoutes');
const viewRouter = require('./dev-data/routes/viewRoutes');
const bookingRouter = require('./dev-data/routes/bookingRoutes');

const app = express();

// MIDDLEWARE

// app.all('*', (req, res, next) => {
//   console.log('hello from the app.all handler!!');
//   next();
// });

// GLOBAL MIDDLEWAREs

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set security headers
app.use(helmet());

// res.setHeader('Content-Security-Policy', "script-src 'self' https://unpkg.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;");

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://unpkg.com/leaflet@1.9.4/dist/leaflet.js https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.8/axios.min.js https://js.stripe.com/v3/",
  );
  next();
});

const limiter = rateLimit({
  max: 30,
  windowMs: 60 * 60 * 1000,
  message: 'too many request from this ip try again in an hour !!!',
});

// limit request from same ip address
app.use('/api', limiter);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// this middleware help us by giving info about the our request

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// note : data sanitization means clean all the data that comes into our app from malicious code

// data sanitization against our no sql injection
app.use(mongoSanitize());
// data sanitization against our xss cross site scripting
app.use(xss());

// to prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'ratingsAverage',
      'ratingsQuantity',
      'duration',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// tp declare a middleware function we use app.use and the it must have 3 parameters
// 1. for request object
// 2. for response object
// 3. for a next function (you must use it or the response will not be sent)
// NOTE : if we declare the middleWare function after the route handler it will never be executed because
// the cycle is already ended .

// some testing middlewares
app.use((req, res, next) => {
  console.log('hello form the middleWare !!');
  next();
});

app.use((req, res, next) => {
  req.requestedTime = new Intl.DateTimeFormat().format(new Date());
  next();
});

// MOUNT

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// it's a route handler for every route and for every http verb
app.all('*', (req, res, next) => {
  // NOTE : when we send the error object as an argumnet to a function , it's gonna invoke
  // the error handling middleware .
  next(new AppError(`we cant find ${req.originalUrl} on the server!!`, 404));
});

// to handle errors in our application we need to declare a golbar error handling middleware
// this middleware is gonna be invoked whenever an error happens .

app.use(globalErrorHandler);

module.exports = app;

// STAUTS CODES
// 200 : OK
// 201 : created
// 404 : not found
// 204 : no content (we use with delete verb)
// 500 : internal server error
// 400 : bad request
// 401 : Unauthorized

/// TOURS ROUTE HANDLERS
// const tryGet = (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'hello from the server side !!', app: 'natours' });
// };

// const tryPost = (req, res) => {
//   res.send('hello from the post !!!');
// };

/// USERS ROUTE HANDLER

// OUR ROUTES

// app.get('/', tryGet);
// app.post('/', tryPost);
// // app.get('/api/v1/tours', getAllTours);
// // app.post('/api/v1/tours', createTour);
// // to get data from a parameter in the url
// app.get('/api/v1/tours/:id', getTour);
// // to update a data we use patch or put
// // patch we use it when we want to update some properties in the object
// // put we use it when we want to update the whole object
// app.patch('/api/v1/tours/:id', updateTour);
// // to delete a piece of data we use delete verb
// app.delete('/api/v1/tours/:id', deleteTour);

// if we have a common route we can .route
