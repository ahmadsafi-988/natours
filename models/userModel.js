const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// create a schema of 5 fields :
// 1) name
// 2) email
// 3) photo (string)
// 4) password
// 5) password confirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'the user must have a name!!'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'the user must ahve an email!!'],
    unique: [true, 'this email is already existing'],
    // validate: {
    //   validator: function (value) {
    //     return validator.isEmail(value);
    //   },
    // },
    validate: [validator.isEmail, 'it is not a valid email!!'],
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'guide', 'lead-guide'],
      message: 'the role must be either admin , user , guide or lead-guide',
    },
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'the user must have a password!!'],
    minLength: [10, 'THE PASSWORD MUST BE MORE THAN 10 LETTERS!!!'],
    // never send the password even it's encrypted to the client
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'you should confirm your password!!'],
    // it only works on create and save
    // to update we need to use the normal update then save it
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: 'it must be the same as password !!',
    },
  },
  changePasswordAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// NOTE : the validation in the schema happens before the mongoose middleware

userSchema.pre('save', async function (next) {
  // it is gonna execute when it's created for the first time or the password has been updated
  if (!this.isModified('password')) return next();

  // encrypt the password
  this.password = await bcrypt.hash(this.password, 10);
  // delete the confirm password (it's required when in inputting data not required
  //    in the data that is gonna be saved in the DB )
  this.passwordConfirm = undefined;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // sometimes it signs the token before the we set the changepasswordAt property to
  // understand more look at the implmentation of protect
  this.changePasswordAt = Date.now() - 1000;
});

// this's called instance function or method , it's gonna be available pn every document (in this case every user).
userSchema.methods.correctPassword = async function (
  inputedPassword,
  realPassword,
) {
  return await bcrypt.compare(inputedPassword, realPassword);
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changePasswordAfter = function (timeStamp) {
  // if this property (passwordChangedAt) exists is gonna make a comparison
  if (this.changePasswordAt) {
    const changePasswordAt = Number.parseInt(
      this.changePasswordAt.getTime() / 1000,
      10,
    );
    console.log('time stamp = ', timeStamp);
    console.log('change password at = ', changePasswordAt);

    return changePasswordAt > timeStamp;
  }
  // if the user has not changed his password
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // first create a ranodm token using crypto module
  const resetToken = crypto.randomBytes(32).toString('hex');

  // second we need to encrypt it and update it to the schema
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log(resetToken);
  console.log(this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 5 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// jwt
// we are gonna assume that the user is already signed up in the website :
// 1. first when he logs in the website , it's gonna send a post request to the server
// 2. the server is gonna check the userName and the password if they are correct
// 3. if so the server is gonna make the jwt then the server is gonna send the jwt to the client and
// (if it's the first time that the user logs in , it's gonna create it )
// 4. the jwt is stored in the local storage and the secret string
// which is a fixed value it's gonna be stored in the enviroment variables
// 5. now there some routes need to check if the jwt is valid or not o if the jwt is still vaild is
// gonna send the response to the client , if not , an error message is gonna appear to the client

// the jwt consists of three parts :
// 1. headers : conatins algorthrim and token type
// 2. payload : conatins some data :
// these two parts are encoded not encrypted .
// 3. signature : which's consists of the headers + the payload + the secert string .

// the process of verifying the JWT :
// . it will take the header and the payload and the secert and make the test signature and compare it
// with the orginal one that is stored in the local storage .

// the benfits of uing jwt are :
// 1) they are stateless , not like the session token they are stored on the server
// 2) with it we can use the same token for multiple platforms , mobile , web ....
// 3) tha main reason to use the jwt strategy is to check if the user that has logged in is the same
// one who is doing some opertaion ,so to protect some routes

// note : we can put another data in the payload , like the ip address and something like that
// watch these videos to undertsand more :
// 1) https://www.youtube.com/watch?v=B-x7eeYtFIA&t=457s
// 2) https://www.youtube.com/watch?v=iB__rLXGsas
