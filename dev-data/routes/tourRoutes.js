const express = require('express');
const toursController = require('../../controllers/toursController');
const authController = require('../../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// routes handlers
// router.param('id', toursController.checkID);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getAllTours);

router.route('/tour-stats').get(toursController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.accessTo('admin', 'lead-guide', 'guide'),
    toursController.getMonthlyPlan,
  );

router
  .route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protect,
    authController.accessTo('admin', 'lead-guide'),
    toursController.createTour,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);

router
  .route('/:id')
  .get(toursController.getTour)
  .patch(
    authController.protect,
    authController.accessTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourImages,
    toursController.updateTour,
  )
  .delete(
    authController.protect,
    authController.accessTo('admin', 'lead-guide'),
    toursController.deleteTour,
  );

// /tour/23243432/reviews
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.accessTo('user'),
//     reviewsController.createReview,
//   );

module.exports = router;
