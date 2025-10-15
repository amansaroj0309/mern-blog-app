import { Link } from 'react-router-dom';
import { Post } from '../pages/PostPage';
import { Button } from 'flowbite-react';
import LikeButton from './LikeButton';
import BookmarkButton from './BookmarkButton';
import { useAppSelector } from '../store/storeHooks';

type PropsType = {
    post: Post;
    onLikeChange?: (postId: string, isLiked: boolean, newCount: number) => void;
    onBookmarkChange?: (postId: string, isBookmarked: boolean) => void;
};

const PostCard = ({ post, onLikeChange, onBookmarkChange }: PropsType) => {
    const { currentUser } = useAppSelector((state) => state.user);
    return (
        <div className='group relative w-full border border-teal-500 hover:border-2 h-[420px] overflow-hidden rounded-lg sm:w-[360px] transition-all'>
            <Link to={`/post/${post.slug}`}>
                <img
                    src={post.image}
                    alt='post cover'
                    className='h-[220px] w-full  object-cover group-hover:h-[200px] transition-all duration-300 z-20'
                />
            </Link>
            <div className='flex flex-col gap-2 p-3 pb-16'>
                <p className='text-base font-semibold line-clamp-2'>{post.title}</p>
                <span className='text-sm italic'>
                    <Link to={`/search?category=${post.category}`}>
                        <Button color='gray' size={'xs'} pill>
                            {post.category}
                        </Button>
                    </Link>
                </span>

                {/* Engagement buttons */}
                <div className='flex items-center justify-between mt-2 relative z-20'>
                    <LikeButton
                        postId={post._id}
                        isLiked={post.likes?.includes(currentUser?._id || '') || false}
                        likesCount={post.numberOfLikes || 0}
                        onLikeChange={(isLiked, newCount) => {
                            onLikeChange?.(post._id, isLiked, newCount);
                        }}
                    />
                    <BookmarkButton
                        postId={post._id}
                        isBookmarked={post.bookmarks?.includes(currentUser?._id || '') || false}
                        onBookmarkChange={(isBookmarked) => {
                            onBookmarkChange?.(post._id, isBookmarked);
                        }}
                    />
                </div>

                <Link
                    to={`/post/${post.slug}`}
                    className='z-10 group-hover:bottom-2 absolute bottom-[-60px] left-0 right-0 border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white transition-all duration-300 text-center py-2 rounded-md m-2'
                >
                    Read article
                </Link>
            </div>
        </div>
    );
};

export default PostCard;
