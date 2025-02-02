const express = require('express');
const reviewsControllers = require('../../controllers/reviewsController');
const authController = require('../../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewsControllers.getAllReviews)
  .post(
    authController.protect,
    authController.accessTo('user'),
    reviewsControllers.setTourAndUserIds,
    reviewsControllers.createReview,
  );

router
  .route('/:id')
  .get(reviewsControllers.getReview)
  .delete(
    authController.accessTo('user', 'admin'),
    reviewsControllers.deleteReview,
  )
  .patch(
    authController.accessTo('user', 'admin'),
    reviewsControllers.updateReview,
  );

module.exports = router;
