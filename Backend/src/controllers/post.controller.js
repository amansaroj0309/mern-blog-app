import Post from '../models/post.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import customError from '../utils/customErrorHandler.js';

export const createPost = asyncHandler(async (req, res, next) => {
    const { title, content, category } = req.body;

    const post = await Post.findOne({ title });
    if (post) {
        return next(new customError(403, 'Create unique post or title'));
    }

    const slug = req.body.title
        .split(' ')
        .join('-')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, '');

    const newPost = new Post({ ...req.body, userId: req.user.id, slug });
    const createdPost = await newPost.save();

    res.status(201).json(new ApiResponse(201, { post: createdPost }, 'post has been created successfully'));
});

export const getPosts = asyncHandler(async (req, res) => {
    const { userId, searchTerm, title, slug, category, postId, sort, select, page, limit } = req.query;
    let queryObject = {};
    let postData;

    //! ......... Data Filteration ............ //
    userId && (queryObject.userId = { $regex: userId, $options: 'i' });
    category && (queryObject.category = { $regex: category, $options: 'i' });
    category === 'all' && delete queryObject.category;
    slug && (queryObject.slug = { $regex: slug, $options: 'i' });
    postId && (queryObject._id = postId);
    searchTerm && {
        $or: [
            (queryObject.title = { $regex: searchTerm, $options: 'i' }),
            (queryObject.content = { $regex: searchTerm, $options: 'i' }),
        ],
    };
    title && (queryObject.title = { $regex: title, $options: 'i' });
    postData = Post.find(queryObject);

    //! ......... Sorting ............ //
    if (sort) {
        let sortFix = sort.split(',').join(' ');
        const sortValue = sortFix === 'desc' ? { createdAt: 1 } : sortFix === 'asc' ? { createdAt: -1 } : sortFix;
        postData = postData.sort(sortValue);
    }

    //! ....... Finding Select items ....... //
    if (select) {
        let selectFix = select.split(',').join(' ');
        postData = postData.select(selectFix);
    }

    //! ....... Pagination ....... //
    let Page = +page || 1;
    let Limit = +limit || 9;
    let skip = (Page - 1) * Limit;
    const leftRange = skip + 1;
    const rightRange = Limit * Page || Limit;
    postData = postData.skip(skip).limit(Limit);

    //! ....... Sending Response ....... //
    const posts = await postData;
    const totalPosts = await Post.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                posts,
                totalPosts,
                lastMonthPosts,
                pageNo: Page,
                itemRange: `${leftRange}-${rightRange}`,
                nbHits: posts.length,
            },
            'success'
        )
    );
});

export const getAllPosts = asyncHandler(async (req, res) => {
    const { userId, searchTerm, title, slug, category, postId, sort, select, page, limit } = req.query;
    let queryObject = {};
    let postData;

    //! ......... Data Filteration ............ //
    userId && (queryObject.userId = { $regex: userId, $options: 'i' });
    category && (queryObject.category = { $regex: category, $options: 'i' });
    category === 'all' && delete queryObject.category;
    slug && (queryObject.slug = { $regex: slug, $options: 'i' });
    postId && (queryObject._id = postId);
    searchTerm && {
        $or: [
            (queryObject.title = { $regex: searchTerm, $options: 'i' }),
            (queryObject.content = { $regex: searchTerm, $options: 'i' }),
        ],
    };
    title && (queryObject.title = { $regex: title, $options: 'i' });
    postData = Post.find(queryObject);

    //! ......... Sorting ............ //
    if (sort) {
        let sortFix = sort.split(',').join(' ');
        const sortValue = sortFix === 'desc' ? { createdAt: 1 } : sortFix === 'asc' ? { createdAt: -1 } : sortFix;
        postData = postData.sort(sortValue);
    }

    //! ....... Finding Select items ....... //
    if (select) {
        let selectFix = select.split(',').join(' ');
        postData = postData.select(selectFix);
    }

    //! ....... Pagination ....... //
    let Page = +page || 1;
    let skip = Page - 1;
    postData = postData.skip(skip);

    //! ....... Sending Response ....... //
    const posts = await postData;
    const totalPosts = await Post.countDocuments();

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                posts,
                totalPosts,
                lastMonthPosts,
                pageNo: Page,
                nbHits: posts.length,
            },
            'success'
        )
    );
});

export const deletePost = asyncHandler(async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
        return next(new customError(403, 'You are not allowed to delete this post'));
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.status(200).json(new ApiResponse(200, {}, 'The post has been deleted'));
});

export const updatePost = asyncHandler(async (req, res, next) => {
    if (req.user.id !== req.params.userId) {
        return next(new customError(403, 'You are not allowed to update this post'));
    }
    console.log(req.body);
    const slug = req.body.title
        .split(' ')
        .join('-')
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, '');

    console.log(slug);

    const updatedPost = await Post.findByIdAndUpdate(
        req.params.postId,
        {
            $set: {
                title: req.body.title,
                slug,
                content: req.body.content,
                category: req.body.category,
                image: req.body.image,
            },
        },
        { new: true }
    );

    console.log(updatePost);

    res.status(201).json(new ApiResponse(201, updatedPost, 'post has been updated successfully'));
});

export const likePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new customError(404, 'Post not found'));
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
        return next(new customError(400, 'You have already liked this post'));
    }

    // Add like
    await Post.findByIdAndUpdate(postId, {
        $push: { likes: userId },
        $inc: { numberOfLikes: 1 }
    });

    res.status(200).json(new ApiResponse(200, null, 'Post liked successfully'));
});

export const unlikePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new customError(404, 'Post not found'));
    }

    // Check if currently liked
    if (!post.likes.includes(userId)) {
        return next(new customError(400, 'You have not liked this post'));
    }

    // Remove like
    await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
        $inc: { numberOfLikes: -1 }
    });

    res.status(200).json(new ApiResponse(200, null, 'Post unliked successfully'));
});

export const bookmarkPost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new customError(404, 'Post not found'));
    }

    // Check if already bookmarked
    if (post.bookmarks.includes(userId)) {
        return next(new customError(400, 'You have already bookmarked this post'));
    }

    // Add bookmark
    await Post.findByIdAndUpdate(postId, {
        $push: { bookmarks: userId },
        $inc: { numberOfBookmarks: 1 }
    });

    res.status(200).json(new ApiResponse(200, null, 'Post bookmarked successfully'));
});

export const unbookmarkPost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        return next(new customError(404, 'Post not found'));
    }

    // Check if currently bookmarked
    if (!post.bookmarks.includes(userId)) {
        return next(new customError(400, 'You have not bookmarked this post'));
    }

    // Remove bookmark
    await Post.findByIdAndUpdate(postId, {
        $pull: { bookmarks: userId },
        $inc: { numberOfBookmarks: -1 }
    });

    res.status(200).json(new ApiResponse(200, null, 'Post unbookmarked successfully'));
});

export const getBookmarkedPosts = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;

    // Find posts that the user has bookmarked
    const posts = await Post.find({ bookmarks: userId })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    const totalBookmarks = await Post.countDocuments({ bookmarks: userId });

    res.status(200).json(new ApiResponse(200, { posts, totalBookmarks }, 'Bookmarked posts fetched successfully'));
});

export const getFollowedUsersPosts = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;

    // Get the current user to find who they're following
    const User = (await import('../models/user.model.js')).default;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
        return next(new customError(404, 'User not found'));
    }

    // If user is not following anyone, return empty array
    if (!currentUser.following || currentUser.following.length === 0) {
        return res.status(200).json(new ApiResponse(200, { posts: [], totalPosts: 0 }, 'No followed users yet'));
    }

    // Find posts from users that the current user is following
    const posts = await Post.find({ userId: { $in: currentUser.following } })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    const totalPosts = await Post.countDocuments({ userId: { $in: currentUser.following } });

    res.status(200).json(new ApiResponse(200, { posts, totalPosts }, 'Followed users posts fetched successfully'));
});

export const getTrendingPosts = asyncHandler(async (req, res, next) => {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;

    // Calculate trending score based on likes, bookmarks, and recency
    // Posts from the last 30 days with high engagement
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find posts and sort by engagement (likes + bookmarks)
    const posts = await Post.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: ['$numberOfLikes', 2] }, // Likes weighted 2x
                        '$numberOfBookmarks' // Bookmarks weighted 1x
                    ]
                }
            }
        },
        {
            $sort: { engagementScore: -1, createdAt: -1 }
        },
        {
            $skip: startIndex
        },
        {
            $limit: limit
        }
    ]);

    const totalTrending = await Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.status(200).json(new ApiResponse(200, { posts, totalPosts: totalTrending }, 'Trending posts fetched successfully'));
});
