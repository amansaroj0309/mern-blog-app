import User from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import customError from '../utils/customErrorHandler.js';
import { accessTokenOptions, refreshTokenOptions } from '../utils/utils.js';

// ......... Controllers .............//
export const updateUser = asyncHandler(async (req, res, next) => {
    const { userName, email, password, profilePicture } = req.body;
    console.log({ userName, email, password, profilePicture });

    if (req.user.id !== req.params.userId) {
        return next(new customError(403, 'You are not allowed to update this user'));
    }

    const user = await User.findById(req.params.userId);

    if (userName) {
        if (userName.length < 7 || userName.length > 20) {
            return next(new customError(400, 'userName must be at between 7 and 20 characters'));
        }
        if (userName.includes(' ')) {
            return next(new customError(400, 'userName cannot contain spaces'));
        }
        if (!userName.match(/^[a-zA-Z0-9]+$/)) {
            return next(new customError(400, 'userName can only contains letter or number'));
        }
        const isUsernameMatched = await User.findOne({ userName: userName.toLowerCase() });
        if (isUsernameMatched) {
            const isAuthorizedUserName = isUsernameMatched.userName === user.userName;
            if (!isAuthorizedUserName) {
                return next(new customError(400, 'userName already exists'));
            }
        }
        user.userName = userName.toLowerCase();
    }

    if (email) {
        if (
            !email.match(
                /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            )
        ) {
            return next(new customError(400, 'Not a valid email'));
        }
        if (email.length < 7) {
            return next(new customError(400, 'email must be at least 7 characters'));
        }
        const isEmailMatched = await User.findOne({ email: email });
        if (isEmailMatched) {
            const isAuthorizedEmail = isEmailMatched.email === user.email;
            if (!isAuthorizedEmail) {
                return next(new customError(400, 'email already exists'));
            }
        }
        user.email = email;
    }

    if (password) {
        if (password.length < 6) {
            return next(new customError(400, 'Password must be at least 6 characters'));
        }
        user.password = password;
    }

    if (profilePicture) {
        user.profilePicture = profilePicture;
    }

    const updatedUser = await user.save();
    console.log(updateUser);

    return res.status(200).json(new ApiResponse(200, { updatedUser }, 'user successfully updated'));
});

export const deleteUser = asyncHandler(async (req, res, next) => {
    if (!req.user.isAdmin && req.user.id !== req.params.userId) {
        return next(new customError(403, 'You are not allowed to delete this user'));
    }
    const deleteUser = await User.findByIdAndDelete(req.params.userId);
    if (!deleteUser) {
        return next(new customError(403, 'Error while deleting user'));
    }

    if (req.user.isAdmin && req.user.id !== req.params.userId) {
        res.status(200).json(new ApiResponse(200, {}, 'user has been deleted'));
    } else {
        res.status(200)
            .clearCookie('accessToken', accessTokenOptions)
            .clearCookie('refreshToken', refreshTokenOptions)
            .json(new ApiResponse(200, {}, 'user has been deleted'));
    }
});

export const logoutUser = asyncHandler(async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
        return next(new customError(403, 'You are not allowed to logout this user'));
    }

    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    res.status(200)
        .clearCookie('accessToken', accessTokenOptions)
        .clearCookie('refreshToken', refreshTokenOptions)
        .json(new ApiResponse(200, { userId: req.user._id }, 'user has been signed out'));
});

export const getUsers = asyncHandler(async (req, res, next) => {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const users = await User.find()
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .select('-password');

    const totalUsers = await User.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    return res.status(200).json(new ApiResponse(200, { users, totalUsers, lastMonthUsers }, 'Users'));
});

export const getUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
        return next(new customError(404, 'User not found'));
    }
    res.status(200).json(new ApiResponse(200, user, 'success'));
});

export const getUserProfile = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    // Find user by username
    const user = await User.findOne({ userName: username }).select('-password -refreshToken');
    if (!user) {
        return next(new customError(404, 'User not found'));
    }

    // Import Post model
    const Post = (await import('../models/post.model.js')).default;

    // Get user's posts
    const posts = await Post.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPosts = await Post.countDocuments({ userId: user._id });

    // Get followers and following details (just counts for now, can expand later)
    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    res.status(200).json(new ApiResponse(200, {
        user: {
            _id: user._id,
            fullName: user.fullName,
            userName: user.userName,
            email: user.email,
            profilePicture: user.profilePicture,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            followersCount,
            followingCount
        },
        posts,
        totalPosts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit)
    }, 'User profile fetched successfully'));
});

export const followUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Can't follow yourself
    if (userId === currentUserId) {
        return next(new customError(400, 'You cannot follow yourself'));
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
        return next(new customError(404, 'User not found'));
    }

    // Check if already following
    const currentUser = await User.findById(currentUserId);
    if (currentUser.following.includes(userId)) {
        return next(new customError(400, 'You are already following this user'));
    }

    // Add to following and followers arrays
    await User.findByIdAndUpdate(currentUserId, { $push: { following: userId } });
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $push: { followers: currentUserId } },
        { new: true }
    ).select('followers following');

    res.status(200).json(new ApiResponse(200, { 
        followersCount: updatedUser.followers.length,
        followingCount: updatedUser.following.length 
    }, 'User followed successfully'));
});

export const unfollowUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Can't unfollow yourself
    if (userId === currentUserId) {
        return next(new customError(400, 'You cannot unfollow yourself'));
    }

    // Check if user exists
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
        return next(new customError(404, 'User not found'));
    }

    // Check if currently following
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.following.includes(userId)) {
        return next(new customError(400, 'You are not following this user'));
    }

    // Remove from following and followers arrays
    await User.findByIdAndUpdate(currentUserId, { $pull: { following: userId } });
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $pull: { followers: currentUserId } },
        { new: true }
    ).select('followers following');

    res.status(200).json(new ApiResponse(200, { 
        followersCount: updatedUser.followers.length,
        followingCount: updatedUser.following.length 
    }, 'User unfollowed successfully'));
});
