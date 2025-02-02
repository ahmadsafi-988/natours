const express = require('express');
const viewController = require('../../controllers/viewController');
const authController = require('../../controllers/authController');
const bookingController = require('../../controllers/bookingsController');

const router = express.Router();

// the main page is the overview page
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview,
);

router.get('/tour/:tourSlug', authController.protect, viewController.getTour);
router.get('/logIn', authController.isLoggedIn, viewController.getLogInForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);
// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUser,
// );

module.exports = router;
