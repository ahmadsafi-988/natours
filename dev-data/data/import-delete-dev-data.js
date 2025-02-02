// require modules
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// require my own modules
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
// we need to put it before we require the app module
dotenv.config({ path: './config.env' });

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

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// importData function
const importData = async function () {
  try {
    // note : create function can accept array of objects
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('data imported successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// deleteData function
const deleteData = async function () {
  try {
    // note : create function can accept array of objects
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('data deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
