import { Button, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/storeHooks';
import { Axios } from '../config/api';
import { handleAxiosError } from '../utils/utils';

// React Icons
import { BsBookmarkFill, BsBookmark } from 'react-icons/bs';

interface BookmarkButtonProps {
    postId: string;
    isBookmarked: boolean;
    onBookmarkChange: (isBookmarked: boolean) => void;
}

const BookmarkButton = ({ postId, isBookmarked, onBookmarkChange }: BookmarkButtonProps) => {
    const [loading, setLoading] = useState(false);
    const [localIsBookmarked, setLocalIsBookmarked] = useState(isBookmarked);
    const { currentUser } = useAppSelector((state) => state.user);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalIsBookmarked(isBookmarked);
    }, [isBookmarked]);

    // Don't show button if user is not logged in
    if (!currentUser) {
        return null;
    }

    const handleBookmark = async () => {
        setLoading(true);
        
        // Optimistically update UI
        const newIsBookmarked = !localIsBookmarked;
        setLocalIsBookmarked(newIsBookmarked);
        
        try {
            if (localIsBookmarked) {
                await Axios.post(`/post/unbookmark/${postId}`);
                onBookmarkChange(false);
            } else {
                await Axios.post(`/post/bookmark/${postId}`);
                onBookmarkChange(true);
            }
        } catch (error) {
            const err = await handleAxiosError(error);
            console.log('Bookmark/Unbookmark error:', err);
            // Revert on error
            setLocalIsBookmarked(!newIsBookmarked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleBookmark}
            disabled={loading}
            color="gray"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            {loading ? (
                <Spinner size="sm" />
            ) : localIsBookmarked ? (
                <BsBookmarkFill className="text-xl text-yellow-500" />
            ) : (
                <BsBookmark className="text-xl" />
            )}
        </Button>
    );
};

export default BookmarkButton;
