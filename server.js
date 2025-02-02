const mongoose = require('mongoose');
const dotenv = require('dotenv');

// we need to put it before we require the app module
dotenv.config({ path: './config.env' });

// to catch the uncaughtException (sync code)
process.on('uncaughtException', (err) => {
  console.log(err.name);
  process.exit(1);
});

const app = require('./app');

// replace the PASSWORD placeholder with the actual passowrd
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// connect our code to the data base using mongoose driver
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connecting successfully'));

// START THE SERVER
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

// sometimes if the connection to the server has been disconnected ,and since it's not inculde our express
// application therefore , it is not handled so we wnt to handled , from the event-driven ARCHITECTURE
//there is an event emitter called unhandledRejection is gonna emit the event to the event listener which's
// gonna call the callback function

// IMPORTANT NOTE : every error should be handled whn it occurs so so dont rely on these emitters
process.on('unhandledRejection', (err) => {
  console.log(err);

  // when the server has done it's work with request , it's gonna close the application
  server.close(() => {
    process.exit(1);
  });
});

// TEST

// to get the the environment variable that represents which environment that we are : for example
// production env or development env
// this env variable is sat by express js
// console.log(app.get('env'));

// we need to define a variable called NODE_ENV to define whether environment that we are
// there si two ways to do it 1) using terminal 2) using an extrenal file

//  to get access to all variables that are in the environment
// console.log(process.env.NODE_ENV);

//  to define a variable using terminal
// $env:NODE_ENV="development"; node server.js
// $env:NODE_ENV="development"; $env:PORT="3000"; node server.js
