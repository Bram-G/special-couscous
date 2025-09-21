'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Skeleton,
  Select,
  SelectItem,
  Divider,
} from '@heroui/react';
import { MessageSquare, SortAsc, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment, CommentSection as CommentSectionType } from '@/types/comments';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CommentSectionProps {
  movieId: number;
  movieTitle?: string;
}

export default function CommentSection({ movieId, movieTitle }: CommentSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [currentSort, setCurrentSort] = useState<'top' | 'new' | 'controversial'>('top');
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch comments for the movie
  const fetchComments = async (sort: 'top' | 'new' | 'controversial' = 'top', page = 1) => {
    try {
      setLoading(page === 1);
      
      const url = new URL(`${API_BASE_URL}/api/comments/${movieId}`);
      url.searchParams.append('sort', sort);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '20');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth header if user is logged in
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url.toString(), { 
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data: CommentSectionType = await response.json();
      
      if (page === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      
      setTotalComments(data.totalComments);
      setHasMore(data.hasMore);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Create a new comment
  const createComment = async (content: string, parentCommentId?: number) => {
    if (!user || !token) {
      setError('You must be logged in to comment');
      return;
    }

    if (content.trim().length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }

    try {
      setSubmittingComment(true);
      
      const response = await fetch(`${API_BASE_URL}/api/comments/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          parentCommentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create comment');
      }

      const data = await response.json();
      
      // Add the new comment to the appropriate place
      if (parentCommentId) {
        // This is a reply - we'll handle this when we implement reply functionality
        await fetchComments(currentSort, 1);
      } else {
        // This is a top-level comment - add it to the beginning
        setComments(prev => [data.comment, ...prev]);
        setTotalComments(prev => prev + 1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error creating comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Vote on a comment
  const voteOnComment = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    if (!user || !token) {
      setError('You must be logged in to vote');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to vote');
      }

      const data = await response.json();
      
      // Update the comment in state with new vote counts
      setComments(prev => updateCommentInTree(prev, commentId, {
        voteScore: data.newCounts.voteScore,
        upvotes: data.newCounts.upvotes,
        downvotes: data.newCounts.downvotes,
        userVote: data.userVote,
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error voting on comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  // Remove vote from a comment
  const removeVote = async (commentId: number) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/vote`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove vote');
      }

      const data = await response.json();
      
      // Update the comment in state
      setComments(prev => updateCommentInTree(prev, commentId, {
        voteScore: data.newCounts.voteScore,
        upvotes: data.newCounts.upvotes,
        downvotes: data.newCounts.downvotes,
        userVote: null,
      }));
    } catch (err) {
      console.error('Error removing vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove vote');
    }
  };

  // Helper function to update a comment in the nested tree structure
  const updateCommentInTree = (
    comments: Comment[], 
    targetId: number, 
    updates: Partial<Comment>
  ): Comment[] => {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return { ...comment, ...updates };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, targetId, updates),
        };
      }
      return comment;
    });
  };

  // Load more comments (pagination)
  const loadMoreComments = async () => {
    if (!hasMore || loading) return;
    await fetchComments(currentSort, currentPage + 1);
  };

  // Handle sort change
  const handleSortChange = (sort: 'top' | 'new' | 'controversial') => {
    setCurrentSort(sort);
    setCurrentPage(1);
    fetchComments(sort, 1);
  };

  // Initial load
  useEffect(() => {
    fetchComments(currentSort);
  }, [movieId]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">
              Discussion {movieTitle && `• ${movieTitle}`}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-small text-default-500">
            <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>

        {/* Sort Controls */}
        {totalComments > 0 && (
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-default-400" />
              <span className="text-small text-default-500">Sort by:</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={currentSort === 'top' ? 'solid' : 'light'}
                color={currentSort === 'top' ? 'primary' : 'default'}
                onPress={() => handleSortChange('top')}
              >
                Top
              </Button>
              <Button
                size="sm"
                variant={currentSort === 'new' ? 'solid' : 'light'}
                color={currentSort === 'new' ? 'primary' : 'default'}
                onPress={() => handleSortChange('new')}
              >
                New
              </Button>
              <Button
                size="sm"
                variant={currentSort === 'controversial' ? 'solid' : 'light'}
                color={currentSort === 'controversial' ? 'primary' : 'default'}
                onPress={() => handleSortChange('controversial')}
              >
                Controversial
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <Divider />

      <CardBody className="gap-4">
        {/* Comment Form */}
        {user ? (
          <CommentForm
            onSubmit={(content) => createComment(content)}
            loading={submittingComment}
            placeholder={`Share your thoughts about ${movieTitle || 'this movie'}...`}
          />
        ) : (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-default-500">
                <a href="/login" className="text-primary hover:underline">
                  Sign in
                </a>{' '}
                to join the discussion
              </p>
            </CardBody>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-danger-200 bg-danger-50">
            <CardBody>
              <p className="text-danger text-sm">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Comments List */}
        {loading && comments.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-24 h-4 rounded" />
                    <Skeleton className="w-16 h-4 rounded" />
                  </div>
                  <Skeleton className="w-full h-16 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="w-16 h-8 rounded" />
                    <Skeleton className="w-16 h-8 rounded" />
                    <Skeleton className="w-16 h-8 rounded" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <>
            <CommentList
              comments={comments}
              onVote={voteOnComment}
              onRemoveVote={removeVote}
              onReply={createComment}
              currentUser={user}
            />
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="flat"
                  onPress={loadMoreComments}
                  isLoading={loading}
                  className="min-w-32"
                >
                  Load More Comments
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-default-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-default-600 mb-2">
                No comments yet
              </h4>
              <p className="text-default-500">
                Be the first to share your thoughts about {movieTitle || 'this movie'}!
              </p>
            </CardBody>
          </Card>
        )}
      </CardBody>
    </Card>
  );
}