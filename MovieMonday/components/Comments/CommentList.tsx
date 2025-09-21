'use client';

import React from 'react';
import { Comment } from '@/types/comments';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  onVote: (commentId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
  onRemoveVote: (commentId: number) => Promise<void>;
  onReply: (content: string, parentCommentId: number) => Promise<void>;
  currentUser: any; // Replace with your User type
  depth?: number;
}

export default function CommentList({
  comments,
  onVote,
  onRemoveVote,
  onReply,
  currentUser,
  depth = 0,
}: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            onVote={onVote}
            onRemoveVote={onRemoveVote}
            onReply={onReply}
            currentUser={currentUser}
            depth={depth}
          />
          
          {/* Render replies with increased depth */}
          {comment.replies && comment.replies.length > 0 && (
            <div className={`mt-3 ${depth < 4 ? 'ml-6 border-l-2 border-default-200 pl-4' : 'ml-4'}`}>
              <CommentList
                comments={comment.replies}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                onReply={onReply}
                currentUser={currentUser}
                depth={depth + 1}
              />
            </div>
          )}
          
          {/* Show "View more replies" if there are more */}
          {comment.hasMoreReplies && (
            <div className={`mt-2 ${depth < 4 ? 'ml-6 pl-4' : 'ml-4'}`}>
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  // TODO: Implement load more replies
                  console.log('Load more replies for comment', comment.id);
                }}
              >
                View {comment.replyCount - (comment.replies?.length || 0)} more replies
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}