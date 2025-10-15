import { Button, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/storeHooks';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';

// React Icons
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';

interface LikeButtonProps {
    postId: string;
    isLiked: boolean;
    likesCount: number;
    onLikeChange: (isLiked: boolean, newCount: number) => void;
}

const LikeButton = ({ postId, isLiked, likesCount, onLikeChange }: LikeButtonProps) => {
    const [loading, setLoading] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(isLiked);
    const [localLikesCount, setLocalLikesCount] = useState(likesCount);
    const { currentUser } = useAppSelector((state) => state.user);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalIsLiked(isLiked);
        setLocalLikesCount(likesCount);
    }, [isLiked, likesCount]);

    // Don't show button if user is not logged in
    if (!currentUser) {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <AiOutlineHeart className="text-xl" />
                <span>{localLikesCount}</span>
            </div>
        );
    }

    const handleLike = async () => {
        if (loading) return; // Prevent multiple clicks
        
        setLoading(true);
        
        // Store original values for potential revert
        const originalIsLiked = localIsLiked;
        const originalCount = localLikesCount;
        
        // Optimistically update UI
        const newIsLiked = !localIsLiked;
        const newCount = newIsLiked ? localLikesCount + 1 : localLikesCount - 1;
        setLocalIsLiked(newIsLiked);
        setLocalLikesCount(newCount);
        
        try {
            if (originalIsLiked) {
                await Axios.post(`/post/unlike/${postId}`);
                onLikeChange(false, newCount);
            } else {
                await Axios.post(`/post/like/${postId}`);
                onLikeChange(true, newCount);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Like/Unlike error:', err);
            // Revert to original values on error
            setLocalIsLiked(originalIsLiked);
            setLocalLikesCount(originalCount);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleLike}
            disabled={loading}
            color="gray"
            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            {loading ? (
                <Spinner size="sm" />
            ) : localIsLiked ? (
                <AiFillHeart className="text-xl text-red-500" />
            ) : (
                <AiOutlineHeart className="text-xl" />
            )}
            <span className="text-sm">{localLikesCount}</span>
        </Button>
    );
};

export default LikeButton;
