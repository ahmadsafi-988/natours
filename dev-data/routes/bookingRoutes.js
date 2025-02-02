const express = require('express');
const authController = require('../../controllers/authController');
const bookingsController = require('../../controllers/bookingsController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingsController.getCheckoutSession);

router.use(authController.accessTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingsController.getAllBookings)
  .post(bookingsController.createBooking);

router
  .route('/:id')
  .get(bookingsController.getOneBooking)
  .patch(bookingsController.updateBooking)
  .delete(bookingsController.deleteBooking);

module.exports = router;
