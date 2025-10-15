import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';
import { useAppSelector } from '../store/storeHooks';
import { Avatar, Button, Spinner, Tabs } from 'flowbite-react';
import { HiDocumentText, HiUserGroup } from 'react-icons/hi';
import FollowButton from '../components/FollowButton';
import LikeButton from '../components/LikeButton';
import BookmarkButton from '../components/BookmarkButton';

interface User {
    _id: string;
    fullName: string;
    userName: string;
    email: string;
    profilePicture: string;
    isAdmin: boolean;
    createdAt: string;
    followersCount: number;
    followingCount: number;
}

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

interface ProfileData {
    user: User;
    posts: Post[];
    totalPosts: number;
    currentPage: number;
    totalPages: number;
}

const UserProfile = () => {
    const { username } = useParams<{ username: string }>();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const { currentUser } = useAppSelector((state) => state.user);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data } = await Axios.get(`/user/profile/${username}`);
                setProfileData(data.data);
                setShowMore(data.data.currentPage < data.data.totalPages);

                // Check if current user is following this user
                if (currentUser) {
                    const userResponse = await Axios.get(`/user/getuser/${data.data.user._id}`);
                    setIsFollowing(userResponse.data.data.followers.includes(currentUser._id));
                }
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching user profile:', err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchUserProfile();
        }
    }, [username, currentUser]);

    const handleShowMore = async () => {
        if (!profileData) return;
        
        setLoadingMore(true);
        try {
            const nextPage = profileData.currentPage + 1;
            const { data } = await Axios.get(`/user/profile/${username}?page=${nextPage}`);
            setProfileData({
                ...data.data,
                posts: [...profileData.posts, ...data.data.posts]
            });
            setShowMore(data.data.currentPage < data.data.totalPages);
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Error loading more posts:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="max-w-4xl mx-auto p-3 text-center">
                <h1 className="text-3xl font-semibold my-7">User not found</h1>
                <Link to="/users" className="text-blue-500 hover:underline">
                    Browse all users
                </Link>
            </div>
        );
    }

    const { user, posts, totalPosts } = profileData;

    return (
        <div className="max-w-6xl mx-auto p-3 mb-10">
            {/* User Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <Avatar
                        img={user.profilePicture}
                        alt={user.fullName}
                        size="xl"
                        rounded
                        className="w-32 h-32"
                    />
                    
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2">{user.fullName}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">@{user.userName}</p>
                        
                        <div className="flex justify-center md:justify-start gap-6 mb-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{totalPosts}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{user.followersCount}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{user.followingCount}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-start gap-3">
                            {currentUser?._id === user._id ? (
                                <Link to="/dashboard?tab=profile">
                                    <Button gradientDuoTone="purpleToBlue">
                                        Edit Profile
                                    </Button>
                                </Link>
                            ) : (
                                currentUser && (
                                    <FollowButton
                                        targetUserId={user._id}
                                        isFollowing={isFollowing}
                                        onFollowChange={(newIsFollowing, counts) => {
                                            setIsFollowing(newIsFollowing);
                                            if (counts && profileData) {
                                                setProfileData({
                                                    ...profileData,
                                                    user: {
                                                        ...user,
                                                        followersCount: counts.followersCount,
                                                        followingCount: counts.followingCount
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                )
                            )}
                        </div>

                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Section */}
            <Tabs aria-label="User profile tabs" style="underline">
                <Tabs.Item active title="Posts" icon={HiDocumentText}>
                    {posts.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                No posts yet
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
                                                        setProfileData(prev => {
                                                            if (!prev) return null;
                                                            return {
                                                                ...prev,
                                                                posts: prev.posts.map(p =>
                                                                    p._id === post._id
                                                                        ? { 
                                                                            ...p, 
                                                                            likes: isLiked 
                                                                                ? [...p.likes, currentUser?._id || ''] 
                                                                                : p.likes.filter(id => id !== currentUser?._id), 
                                                                            numberOfLikes: newCount 
                                                                        }
                                                                        : p
                                                                )
                                                            };
                                                        });
                                                    }}
                                                />
                                                <BookmarkButton
                                                    postId={post._id}
                                                    isBookmarked={post.bookmarks.includes(currentUser?._id || '')}
                                                    onBookmarkChange={(isBookmarked) => {
                                                        setProfileData(prev => {
                                                            if (!prev) return null;
                                                            return {
                                                                ...prev,
                                                                posts: prev.posts.map(p =>
                                                                    p._id === post._id
                                                                        ? { 
                                                                            ...p, 
                                                                            bookmarks: isBookmarked 
                                                                                ? [...p.bookmarks, currentUser?._id || ''] 
                                                                                : p.bookmarks.filter(id => id !== currentUser?._id)
                                                                        }
                                                                        : p
                                                                )
                                                            };
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {showMore && (
                                <div className="text-center mt-8">
                                    <Button
                                        onClick={handleShowMore}
                                        disabled={loadingMore}
                                        gradientDuoTone="purpleToBlue"
                                        outline
                                    >
                                        {loadingMore ? 'Loading...' : 'Show More'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Tabs.Item>
                
                <Tabs.Item title="About" icon={HiUserGroup}>
                    <div className="py-6">
                        <h2 className="text-2xl font-semibold mb-4">About {user.fullName}</h2>
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                            <p><strong>Username:</strong> @{user.userName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric' 
                            })}</p>
                            <p><strong>Total Posts:</strong> {totalPosts}</p>
                            {user.isAdmin && (
                                <p className="text-blue-600 dark:text-blue-400">
                                    <strong>Role:</strong> Administrator
                                </p>
                            )}
                        </div>
                    </div>
                </Tabs.Item>
            </Tabs>
        </div>
    );
};

export default UserProfile;
