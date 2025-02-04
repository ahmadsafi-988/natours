/* eslint-disable arrow-body-style */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// jwt.verify
const promisfiedVerify = function (token, secert) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secert, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // for preventing any trials to access to the cookie in the browser
    httpOnly: true,
  };

  // secure option for preventing send the cookie if we dont use https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // a cookie is a piece of text that is sent by the server and then automatically stored in the browers
  // and it's gonna be sent back to the server whenever a request hits the server
  res.cookie('jwt', token, cookieOptions);
  const jsonResponse = {
    status: 'success!!',
    token,
  };

  if (statusCode === 201) {
    jsonResponse.data = {
      user,
    };
  }

  res.status(statusCode).json(jsonResponse);
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // const newUser = await User.create(req.body);
  newUser.password = undefined;
  createAndSendToken(newUser, 201, res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  // 1. we need extract the email and the password field from the body of the request
  const { email, password } = req.body;
  // 2. we need to check if the email  and password exists in the req.body , if not , throw an error
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }
  // 3. we need to check if the email exists (in our DB) and the password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(' incorrect email or password', 401));
  }
  // 4. if we pass the previous steps , just send the token and the response
  createAndSendToken(user, 200, res);
});

exports.logOut = function (req, res) {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and checks if it exists
  let token;
  // usually we send token in the headers of the request.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('you are not logged in , log in to get access!!', 401),
    );
  }

  // 2) verfication token
  // note , there are two cases if we have get an error , 1) invalid token 2)the token is expired
  const decoded = await promisfiedVerify(token, process.env.JWT_SECRET);

  // 3) check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(
      new AppError(
        'the user belonging to that token does no longer exists',
        401,
      ),
    );
  }

  // 4) check if the user has changed his password
  // for that we're gonna define an instance method to do this job
  if (currentUser.changePasswordAfter(decoded.iat)) {
    next(
      new AppError(
        'user recently changed the password ! , please log in again',
        401,
      ),
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// this function is responsible to check if the user is logged In or not .
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2) verfication token
      // note , there are two cases if we have get an error , 1) invalid token 2)the token is expired
      const decoded = await promisfiedVerify(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 3) check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) check if the user has changed his password
      // for that we're gonna define an instance method to do this job
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // this var is accessable in OUR PUG TEMPLATE
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.accessTo = (...roles) => {
  return (req, res, next) => {
    // role = user , roles = ['admin' , 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you dont have the permisiion to do this operation', 403),
      );
    }
    next();
  };
};

// forget and reset password functionality
// first the user must sent a post request to the forget password route with email ,
// then a random token (not JWT) will be sent to the user or the email address that was provided
// then the user send the new token along with the new password

// it's like that in the UI , you're gonna send your email in a field , then a link that is gonna be sent to your
// email , when you click this link , it's gonna move you to a page to put your new password

// note : we send the token to the user to use it as a reset password to change the real password
exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) get the user that is provided in the req.body
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('no user found with this email!!!!! ', 404));
  }

  // 2) generate a ranodm token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send that token to the email that was provided
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password , click the following link ${resetURL} , if you dont forget your password
  please ignore this email `;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // send the response to end the req-res cycle
    res.status(200).json({
      status: 'sucess',
      message: 'token is sent to the email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    next(
      new AppError('there was an error sending the email , try again ', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get the token and encrypt it
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) get the user that based on the token and check if the token is still valid

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('token is invalid or has benn expired', 400));
  }
  // 3) set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) log in send the token to the client
  // note we send token in this controller for better user experience and for not letting the user
  // logging in again , and for unauthorize all other devices that logged in uisng the same account
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user with password
  const user = await User.findById(req.user.id).select('+password');

  // 2) check if the posted password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(
      new AppError(
        'the password you entered is incorrect , please try again',
        401,
      ),
    );
  }
  // 3) if so , update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4) send the token
  createAndSendToken(user, 200, res);
});
