'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  ArrowUp,
  ArrowDown,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Clock,
} from 'lucide-react';
import { Comment } from '@/types/comments';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
  onRemoveVote: (commentId: number) => Promise<void>;
  onReply: (content: string, parentCommentId: number) => Promise<void>;
  currentUser: any; // Replace with your User type
  depth: number;
}

export default function CommentItem({
  comment,
  onVote,
  onRemoveVote,
  onReply,
  currentUser,
  depth,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Handle voting
  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!currentUser) return;
    
    setVoteLoading(true);
    try {
      if (comment.userVote === voteType) {
        // Remove vote if clicking the same vote type
        await onRemoveVote(comment.id);
      } else {
        // Add or change vote
        await onVote(comment.id, voteType);
      }
    } finally {
      setVoteLoading(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (content: string) => {
    setReplyLoading(true);
    try {
      await onReply(content, comment.id);
      setShowReplyForm(false);
    } finally {
      setReplyLoading(false);
    }
  };

  // Check if user is the comment author
  const isAuthor = currentUser?.id === comment.userId;

  // Get vote button colors
  const getVoteButtonColor = (voteType: 'upvote' | 'downvote') => {
    if (comment.userVote === voteType) {
      return voteType === 'upvote' ? 'success' : 'danger';
    }
    return 'default';
  };

  const getVoteButtonVariant = (voteType: 'upvote' | 'downvote') => {
    if (comment.userVote === voteType) {
      return 'solid';
    }
    return 'light';
  };

  return (
    <Card className={`w-full ${depth > 0 ? 'bg-default-50' : ''}`}>
      <CardBody className="p-4">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              name={comment.author.username}
              className="text-tiny"
            />
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.author.username}
              </span>
              {isAuthor && (
                <Chip size="sm" color="primary" variant="flat">
                  Author
                </Chip>
              )}
              <div className="flex items-center gap-1 text-tiny text-default-400">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(comment.createdAt)}</span>
                {comment.isEdited && (
                  <span className="text-default-300">(edited)</span>
                )}
              </div>
            </div>
          </div>

          {/* More Actions Menu */}
          {currentUser && (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="min-w-8 w-8 h-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Comment actions">
                {isAuthor ? (
                  <>
                    <DropdownItem
                      key="edit"
                      startContent={<Edit className="h-4 w-4" />}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      startContent={<Trash2 className="h-4 w-4" />}
                      className="text-danger"
                      color="danger"
                    >
                      Delete
                    </DropdownItem>
                  </>
                ) : (
                  <DropdownItem
                    key="report"
                    startContent={<Flag className="h-4 w-4" />}
                  >
                    Report
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>

        {/* Comment Content */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Vote and Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Voting Buttons */}
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant={getVoteButtonVariant('upvote')}
              color={getVoteButtonColor('upvote')}
              onPress={() => handleVote('upvote')}
              isDisabled={!currentUser || voteLoading}
              className="min-w-8 w-8 h-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            
            <span 
              className={`text-sm font-medium min-w-8 text-center ${
                comment.voteScore > 0 
                  ? 'text-success' 
                  : comment.voteScore < 0 
                  ? 'text-danger' 
                  : 'text-default-500'
              }`}
            >
              {comment.voteScore}
            </span>
            
            <Button
              isIconOnly
              size="sm"
              variant={getVoteButtonVariant('downvote')}
              color={getVoteButtonColor('downvote')}
              onPress={() => handleVote('downvote')}
              isDisabled={!currentUser || voteLoading}
              className="min-w-8 w-8 h-8"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Reply Button */}
          {currentUser && depth < 5 && (
            <Button
              size="sm"
              variant="light"
              startContent={<Reply className="h-4 w-4" />}
              onPress={() => setShowReplyForm(!showReplyForm)}
              className="text-sm"
            >
              Reply
            </Button>
          )}

          {/* Reply Count */}
          {comment.replyCount > 0 && (
            <span className="text-tiny text-default-400 ml-2">
              {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && currentUser && (
          <div className="mt-4 pt-4 border-t border-default-200">
            <CommentForm
              onSubmit={handleReplySubmit}
              loading={replyLoading}
              placeholder={`Reply to ${comment.author.username}...`}
              size="sm"
              showCancel
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}