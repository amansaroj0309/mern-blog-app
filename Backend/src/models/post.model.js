import { Schema, model } from 'mongoose';

const postSchema = new Schema(
    {
        userId: { type: String, required: true },
        title: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        content: { type: String, required: true },
        image: {
            type: String,
            default:
                'https://www.salesforce.com/ca/blog/wp-content/uploads/sites/12/2023/10/anatomy-of-a-blog-post-deconstructed-open-graph.jpg',
        },
        category: { type: String, default: 'uncategorized' },
        likes: [{ type: String }], // Array of user IDs who liked this post
        numberOfLikes: { type: Number, default: 0 },
        bookmarks: [{ type: String }], // Array of user IDs who bookmarked this post
        numberOfBookmarks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Post = model('Post', postSchema);
export default Post;
