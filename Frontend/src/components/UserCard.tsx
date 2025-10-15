import { Avatar, Card } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';
import FollowButton from './FollowButton';

interface User {
    _id: string;
    fullName: string;
    userName: string;
    profilePicture: string;
    followers: string[];
    following: string[];
}

interface UserCardProps {
    userId: string;
}

const UserCard = ({ userId }: UserCardProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await Axios.get(`/user/getuser/${userId}`);
                setUser(data.data);
                
                // Check if current user is following this user
                const currentUserResponse = await Axios.get('/auth/validate-token');
                const currentUserId = currentUserResponse.data.data.user._id;
                setIsFollowing(data.data.followers.includes(currentUserId));
            } catch (error) {
                const err = await handleAxiosError(error);
                console.log('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    if (loading) {
        return (
            <Card className="max-w-sm">
                <div className="flex items-center space-x-4">
                    <div className="animate-pulse">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
            </Card>
        );
    }

    if (!user) {
        return (
            <Card className="max-w-sm">
                <p className="text-gray-500">User not found</p>
            </Card>
        );
    }

    return (
        <Card className="max-w-sm">
            <div className="flex flex-col items-center pb-10">
                <Link to={`/user/${user.userName}`}>
                    <Avatar
                        alt={`${user.fullName} profile picture`}
                        img={user.profilePicture}
                        rounded
                        size="lg"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                </Link>
                <Link to={`/user/${user.userName}`} className="hover:underline">
                    <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                    </h5>
                </Link>
                <Link to={`/user/${user.userName}`} className="hover:underline">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.userName}
                    </span>
                </Link>
                <div className="flex mt-4 space-x-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.followers.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Followers
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.following.length}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Following
                        </div>
                    </div>
                </div>
                <FollowButton
                    targetUserId={user._id}
                    isFollowing={isFollowing}
                    onFollowChange={(newIsFollowing, counts) => {
                        setIsFollowing(newIsFollowing);
                        // Update counts with actual data from backend
                        if (counts) {
                            setUser(prevUser => {
                                if (!prevUser) return null;
                                // Create arrays with correct length based on counts
                                const newFollowers = Array(counts.followersCount).fill('');
                                const newFollowing = Array(counts.followingCount).fill('');
                                return {
                                    ...prevUser,
                                    followers: newFollowers,
                                    following: newFollowing
                                };
                            });
                        }
                    }}
                />
            </div>
        </Card>
    );
};

export default UserCard;
