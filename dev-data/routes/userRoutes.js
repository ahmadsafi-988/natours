const express = require('express');
const usersControllers = require('../../controllers/usersController');
const authController = require('../../controllers/authController');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  console.log(`the id is:${val}`);
  next();
});

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.get('/logout', authController.logOut);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all the routes that are afte rthis middleware
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router.get(
  '/me',
  authController.protect,
  usersControllers.getMe,
  usersControllers.getUser,
);
router.patch(
  '/updateMe',
  authController.protect,
  usersControllers.uploadUserPhoto,
  usersControllers.resizeImage,
  usersControllers.updateMe,
);
router.delete('/deleteMe', authController.protect, usersControllers.deleteMe);

router.use(authController.accessTo('admin'));
// for users
router
  .route('/')
  .get(usersControllers.getAllUsers)
  .post(usersControllers.createUser);
router
  .route('/:id')
  .get(usersControllers.getUser)
  .patch(usersControllers.updateUser)
  .delete(usersControllers.deleteUser);

module.exports = router;
