import { Link, useParams } from 'react-router-dom';
import { handleAxiosError } from '../utils/utils';
import { Button, Spinner } from 'flowbite-react';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import { Axios } from '../config/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../store/storeHooks';

export type Post = {
    _id: string;
    userId: string;
    title: string;
    slug: string;
    content: string;
    image: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
    likes?: string[];
    numberOfLikes?: number;
    bookmarks?: string[];
    numberOfBookmarks?: number;
};

const PostPage = () => {
    const { postSlug } = useParams();
    const { currentUser } = useAppSelector((state) => state.user);

    const { isLoading, data: post } = useQuery({
        queryKey: [postSlug],
        queryFn: async () => {
            try {
                const { data } = await Axios(`/post/getposts?slug=${postSlug}`);
                return data.data.posts[0];
            } catch (error) {
                const err = handleAxiosError(error);
                console.log(err);
            }
        },
    });

    const { data: recentPosts } = useQuery({
        queryKey: ['recentPosts'],
        queryFn: async () => {
            try {
                const { data } = await Axios(`/post/getallposts`);
                const posts = data.data.posts.reverse().slice(0, 3);
                return posts;
            } catch (error) {
                const err = handleAxiosError(error);
                console.log(err);
            }
        },
        placeholderData: keepPreviousData,
    });

    if (isLoading) {
        return (
            <div className='grid min-h-screen place-content-center'>
                <Spinner size={'xl'} />
            </div>
        );
    }
    return (
        post && (
            <main className='flex flex-col max-w-6xl min-h-screen mx-auto'>
                {/* Article Header */}
                <article className='w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='py-8 sm:py-12'>
                        <h1 className='font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 leading-tight'>
                            {post.title}
                        </h1>
                        
                        <div className='flex items-center justify-center gap-4 mb-8'>
                            <Link to={`/search?category=${post?.category}`}>
                                <Button color='gray' size='sm' pill>
                                    {post.category}
                                </Button>
                            </Link>
                        </div>
                        
                        <div className='flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8'>
                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{(post.content.length / 1000).toFixed(0)} min read</span>
                        </div>
                    </div>
                    
                    {/* Featured Image */}
                    <div className='mb-12'>
                        <img 
                            src={post.image} 
                            alt={post.title} 
                            className='w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg' 
                        />
                    </div>
                    
                    {/* Article Content */}
                    <div
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        className='prose prose-lg dark:prose-invert max-w-none mb-12 post-content'
                    ></div>
                    
                    {/* Engagement Section */}
                    <div className='border-t border-b border-gray-200 dark:border-gray-700 py-6 my-12'>
                        <div className='flex items-center justify-center gap-4'>
                            <LikeButton
                                postId={post._id}
                                isLiked={post.likes?.includes(currentUser?._id || '') || false}
                                likesCount={post.numberOfLikes || 0}
                                onLikeChange={() => {}}
                            />
                            <div className='h-8 w-px bg-gray-300 dark:bg-gray-600'></div>
                            <BookmarkButton
                                postId={post._id}
                                isBookmarked={post.bookmarks?.includes(currentUser?._id || '') || false}
                                onBookmarkChange={() => {}}
                            />
                        </div>
                    </div>
                </article>
                
                {/* Comments Section */}
                <div className='w-full bg-gray-50 dark:bg-gray-900/50 py-12'>
                    <CommentSection postId={post._id} />
                </div>
                
                {/* Recent Articles Section */}
                <div className='w-full py-16 px-4'>
                    <div className='max-w-6xl mx-auto'>
                        <h2 className='text-2xl sm:text-3xl font-bold text-center mb-2'>
                            Recent Articles
                        </h2>
                        <div className='w-20 h-1 bg-teal-500 mx-auto mb-12'></div>
                        
                        <div className='flex flex-wrap justify-center gap-6'>
                            {recentPosts &&
                                recentPosts.map((recentpost: Post) => <PostCard key={recentpost._id} post={recentpost} />)}
                        </div>
                    </div>
                </div>
            </main>
        )
    );
};

export default PostPage;
