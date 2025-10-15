import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';
import { useAppSelector } from '../store/storeHooks';

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

const Bookmarks = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMore, setShowMore] = useState(true);
    const [showMoreLoading, setShowMoreLoading] = useState(false);
    const { currentUser } = useAppSelector((state) => state.user);

    useEffect(() => {
        const fetchBookmarkedPosts = async () => {
            try {
                const { data } = await Axios.get('/post/bookmarks');
                setPosts(data.data.posts);
                if (data.data.posts.length < 9) {
                    setShowMore(false);
                }
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching bookmarked posts:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchBookmarkedPosts();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleShowMore = async () => {
        setShowMoreLoading(true);
        const startIndex = posts.length;
        try {
            const { data } = await Axios.get(`/post/bookmarks?startIndex=${startIndex}`);
            setPosts([...posts, ...data.data.posts]);
            if (data.data.posts.length < 9) {
                setShowMore(false);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Error fetching more bookmarked posts:', err);
        } finally {
            setShowMoreLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="max-w-6xl mx-auto p-3">
                <h1 className="text-3xl font-semibold text-center my-7">Bookmarks</h1>
                <div className="text-center">
                    <p className="text-gray-500">Please sign in to view your bookmarks.</p>
                    <Link to="/sign-in" className="text-blue-500 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-3">
                <h1 className="text-3xl font-semibold text-center my-7">Bookmarks</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-300 rounded-lg h-64"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-3">
            <h1 className="text-3xl font-semibold text-center my-7">Your Bookmarks</h1>
            
            {posts.length === 0 ? (
                <div className="text-center">
                    <p className="text-gray-500 text-lg">No bookmarked posts yet.</p>
                    <Link to="/" className="text-blue-500 hover:underline">
                        Discover posts to bookmark
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                            {post.category}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                                        <Link 
                                            to={`/post/${post.slug}`}
                                            className="hover:underline"
                                        >
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <LikeButton
                                                postId={post._id}
                                                isLiked={post.likes.includes(currentUser._id)}
                                                likesCount={post.numberOfLikes}
                                                onLikeChange={(isLiked, newCount) => {
                                                    setPosts(prevPosts =>
                                                        prevPosts.map(p =>
                                                            p._id === post._id
                                                                ? { ...p, likes: isLiked ? [...p.likes, currentUser._id] : p.likes.filter(id => id !== currentUser._id), numberOfLikes: newCount }
                                                                : p
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                        <BookmarkButton
                                            postId={post._id}
                                            isBookmarked={post.bookmarks.includes(currentUser._id)}
                                            onBookmarkChange={(isBookmarked) => {
                                                if (!isBookmarked) {
                                                    // Remove from bookmarks list
                                                    setPosts(prevPosts =>
                                                        prevPosts.filter(p => p._id !== post._id)
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {showMore && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleShowMore}
                                disabled={showMoreLoading}
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                {showMoreLoading ? 'Loading...' : 'Show More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Bookmarks;
