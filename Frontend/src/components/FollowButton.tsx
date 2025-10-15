import { Button, Spinner } from 'flowbite-react';
import { useState } from 'react';
import { useAppSelector } from '../store/storeHooks';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';

interface FollowButtonProps {
    targetUserId: string;
    isFollowing: boolean;
    onFollowChange: (isFollowing: boolean, counts?: { followersCount: number; followingCount: number }) => void;
}

const FollowButton = ({ targetUserId, isFollowing, onFollowChange }: FollowButtonProps) => {
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAppSelector((state) => state.user);

    // Don't show button if it's the current user
    if (currentUser?._id === targetUserId) {
        return null;
    }

    const handleFollow = async () => {
        if (loading) return; // Prevent double clicks
        
        setLoading(true);
        try {
            if (isFollowing) {
                const { data } = await Axios.post(`/user/unfollow/${targetUserId}`);
                onFollowChange(false, data.data);
            } else {
                const { data } = await Axios.post(`/user/follow/${targetUserId}`);
                onFollowChange(true, data.data);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Follow/Unfollow error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleFollow}
            disabled={loading}
            gradientDuoTone={isFollowing ? 'pinkToOrange' : 'purpleToBlue'}
            outline={!isFollowing}
            className="mt-2"
        >
            {loading ? (
                <Spinner size="sm" />
            ) : (
                isFollowing ? 'Unfollow' : 'Follow'
            )}
        </Button>
    );
};

export default FollowButton;
