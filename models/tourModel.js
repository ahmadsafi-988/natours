/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
// create our first SCHEMA
// A schema consists of fields and each field has it's own validator
// the built-in validators :
// max , min works for NUMBERS
// maxLength , minLength , enum and match works for STRINGS
// NOTE : we can make our custom validators
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name!!!'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tours name must have less than or equals 40 characters ',
      ],
      minLength: [
        10,
        'A tours name must have more than or equal 10 characters',
      ],
      // validate: [validator.isAlpha, 'the name must be an alpha name'],
    },
    slug: String,
    secertTour: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'the difficulty must be either : easy , medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'A tour must have a rating below or equals 5.0 '],
      min: [1, 'A tour must have a rating  above or equals 1.0 '],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price!!!'],
    },
    priceDiscount: {
      type: Number,
      // note this just works when we created documents not when we update
      validate: {
        validator: function (value) {
          return this.price > value;
        },
        message: 'the priceDiscount must be lower or equal the price itself!!!',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image Cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 });
// creating indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration / 7).toFixed(3);
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// this middleware function is gonna work on just save and create events
// there are many events like remove , updateOne ,deleteOne , find ...
// these are documents middleware , this keyword refers to the document itself
// tourSchema.pre('save', function (next) {
//   console.log(this);
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// these are query middleware , this keyword refers to the query itself
// note this just works for find not findOne method
// tourSchema.pre('find', function (next) {
//   this.find({ secertTour: { $ne: true } });
//   next();
// });

// to make it work for findOne
// tourSchema.pre('findOne', function (next) {
//   this.find({ secertTour: { $ne: true } });
//   next();
// });

// to make it for both
// tourSchema.pre(/^find/, function (next) {
//   this.find({ secertTour: { $ne: true } });
//   this.start = Date.now();
//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`it took ${Date.now() - this.start} ms`);
//   console.log(this);
//   next();
// });

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secertTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// crete our models which's help us to interact with the DB

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
