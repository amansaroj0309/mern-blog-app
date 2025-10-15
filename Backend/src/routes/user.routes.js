import { Router } from 'express';
import { deleteUser, followUser, getUser, getUserProfile, getUsers, logoutUser, unfollowUser, updateUser } from '../controllers/user.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = new Router();

// Public Routes....*:
router.route('/getuser/:userId').get(getUser);
router.route('/profile/:username').get(getUserProfile);

// Private Routes....*:
router.route('/update/:userId').put(verifyToken, updateUser);
router.route('/delete/:userId').delete(verifyToken, deleteUser);
router.route('/logout/:userId').post(verifyToken, logoutUser);
router.route('/getusers').get(verifyToken, getUsers);
router.route('/follow/:userId').post(verifyToken, followUser);
router.route('/unfollow/:userId').post(verifyToken, unfollowUser);

export { router as userRoutes };
