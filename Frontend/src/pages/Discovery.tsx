import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import { useAppSelector } from '../store/storeHooks';
import { Tabs } from 'flowbite-react';
import { HiUserGroup, HiTrendingUp } from 'react-icons/hi';

interface Post {
    _id: string;
    title: string;
    slug: string;
    content: string;
    image: string;
    category: string;
    userId: string;
    likes: string[];
    numberOfLikes: number;
    bookmarks: string[];
    numberOfBookmarks: number;
    createdAt: string;
}

const Discovery = () => {
    const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
    const [followingLoading, setFollowingLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [showMoreFollowing, setShowMoreFollowing] = useState(true);
    const [showMoreTrending, setShowMoreTrending] = useState(true);
    const [showMoreFollowingLoading, setShowMoreFollowingLoading] = useState(false);
    const [showMoreTrendingLoading, setShowMoreTrendingLoading] = useState(false);
    const { currentUser } = useAppSelector((state) => state.user);

    // Fetch posts from followed users
    useEffect(() => {
        const fetchFollowingPosts = async () => {
            try {
                const { data } = await Axios.get('/post/discovery/following');
                setFollowingPosts(data.data.posts);
                if (data.data.posts.length < 9) {
                    setShowMoreFollowing(false);
                }
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching following posts:', err);
            } finally {
                setFollowingLoading(false);
            }
        };

        if (currentUser) {
            fetchFollowingPosts();
        } else {
            setFollowingLoading(false);
        }
    }, [currentUser]);

    // Fetch trending posts
    useEffect(() => {
        const fetchTrendingPosts = async () => {
            try {
                const { data } = await Axios.get('/post/discovery/trending');
                setTrendingPosts(data.data.posts);
                if (data.data.posts.length < 9) {
                    setShowMoreTrending(false);
                }
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching trending posts:', err);
            } finally {
                setTrendingLoading(false);
            }
        };

        fetchTrendingPosts();
    }, []);

    const handleShowMoreFollowing = async () => {
        setShowMoreFollowingLoading(true);
        const startIndex = followingPosts.length;
        try {
            const { data } = await Axios.get(`/post/discovery/following?startIndex=${startIndex}`);
            setFollowingPosts([...followingPosts, ...data.data.posts]);
            if (data.data.posts.length < 9) {
                setShowMoreFollowing(false);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Error fetching more following posts:', err);
        } finally {
            setShowMoreFollowingLoading(false);
        }
    };

    const handleShowMoreTrending = async () => {
        setShowMoreTrendingLoading(true);
        const startIndex = trendingPosts.length;
        try {
            const { data } = await Axios.get(`/post/discovery/trending?startIndex=${startIndex}`);
            setTrendingPosts([...trendingPosts, ...data.data.posts]);
            if (data.data.posts.length < 9) {
                setShowMoreTrending(false);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Error fetching more trending posts:', err);
        } finally {
            setShowMoreTrendingLoading(false);
        }
    };

    const renderPostGrid = (posts: Post[], loading: boolean, emptyMessage: string) => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-300 dark:bg-gray-700 rounded-lg h-80"></div>
                        </div>
                    ))}
                </div>
            );
        }

        if (posts.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                        <Link to={`/post/${post.slug}`}>
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                            />
                        </Link>
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                    {post.category}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                                <Link 
                                    to={`/post/${post.slug}`}
                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    {post.title}
                                </Link>
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                                {post.content.replace(/<[^>]*>/g, '')}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                <LikeButton
                                    postId={post._id}
                                    isLiked={post.likes.includes(currentUser?._id || '')}
                                    likesCount={post.numberOfLikes}
                                    onLikeChange={(isLiked, newCount) => {
                                        const updatePosts = (prevPosts: Post[]) =>
                                            prevPosts.map(p =>
                                                p._id === post._id
                                                    ? { 
                                                        ...p, 
                                                        likes: isLiked 
                                                            ? [...p.likes, currentUser?._id || ''] 
                                                            : p.likes.filter(id => id !== currentUser?._id), 
                                                        numberOfLikes: newCount 
                                                    }
                                                    : p
                                            );
                                        setFollowingPosts(updatePosts);
                                        setTrendingPosts(updatePosts);
                                    }}
                                />
                                <BookmarkButton
                                    postId={post._id}
                                    isBookmarked={post.bookmarks.includes(currentUser?._id || '')}
                                    onBookmarkChange={(isBookmarked) => {
                                        const updatePosts = (prevPosts: Post[]) =>
                                            prevPosts.map(p =>
                                                p._id === post._id
                                                    ? { 
                                                        ...p, 
                                                        bookmarks: isBookmarked 
                                                            ? [...p.bookmarks, currentUser?._id || ''] 
                                                            : p.bookmarks.filter(id => id !== currentUser?._id)
                                                    }
                                                    : p
                                            );
                                        setFollowingPosts(updatePosts);
                                        setTrendingPosts(updatePosts);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-3">
            <h1 className="text-3xl font-semibold text-center my-7">Discover</h1>
            
            <Tabs aria-label="Discovery tabs" style="underline">
                <Tabs.Item active title="Following" icon={HiUserGroup}>
                    {!currentUser ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Please sign in to see posts from users you follow.
                            </p>
                            <Link to="/sign-in" className="text-blue-500 hover:underline text-lg">
                                Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            {renderPostGrid(
                                followingPosts, 
                                followingLoading, 
                                "You're not following anyone yet. Discover users to follow!"
                            )}
                            
                            {showMoreFollowing && followingPosts.length > 0 && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleShowMoreFollowing}
                                        disabled={showMoreFollowingLoading}
                                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                    >
                                        {showMoreFollowingLoading ? 'Loading...' : 'Show More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </Tabs.Item>
                
                <Tabs.Item title="Trending" icon={HiTrendingUp}>
                    {renderPostGrid(
                        trendingPosts, 
                        trendingLoading, 
                        "No trending posts at the moment. Check back later!"
                    )}
                    
                    {showMoreTrending && trendingPosts.length > 0 && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleShowMoreTrending}
                                disabled={showMoreTrendingLoading}
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {showMoreTrendingLoading ? 'Loading...' : 'Show More'}
                            </button>
                        </div>
                    )}
                </Tabs.Item>
            </Tabs>
        </div>
    );
};

export default Discovery;
