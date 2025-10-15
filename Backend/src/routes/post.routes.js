import { Router } from 'express';
import verifyToken from '../middlewares/auth.middleware.js';
import { createPost, deletePost, getAllPosts, getPosts, updatePost, likePost, unlikePost, bookmarkPost, unbookmarkPost, getBookmarkedPosts, getFollowedUsersPosts, getTrendingPosts } from '../controllers/post.controller.js';
import { createPostSchema } from '../validators/post.valodator.js';
import validate from '../middlewares/validator.middleware.js';

const router = Router();

router.route('/create').post(verifyToken, validate(createPostSchema), createPost);
router.route('/getposts').get(getPosts);
router.route('/getallposts').get(getAllPosts);
router.route('/deletepost/:postId/:userId').delete(verifyToken, deletePost);
router.route('/updatepost/:postId/:userId').put(verifyToken, updatePost);
router.route('/like/:postId').post(verifyToken, likePost);
router.route('/unlike/:postId').post(verifyToken, unlikePost);
router.route('/bookmark/:postId').post(verifyToken, bookmarkPost);
router.route('/unbookmark/:postId').post(verifyToken, unbookmarkPost);
router.route('/bookmarks').get(verifyToken, getBookmarkedPosts);
router.route('/discovery/following').get(verifyToken, getFollowedUsersPosts);
router.route('/discovery/trending').get(getTrendingPosts);

export { router as postRoutes };
