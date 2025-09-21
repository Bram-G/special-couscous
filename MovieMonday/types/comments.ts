export interface CommentAuthor {
  id: number;
  username: string;
}

export interface Comment {
  id: number;
  commentSectionId: number;
  userId: number;
  parentCommentId?: number;
  content: string;
  voteScore: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  depth: number;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  userVote?: 'upvote' | 'downvote' | null;
  replies?: Comment[];
  hasMoreReplies?: boolean;
}

export interface CommentSection {
  comments: Comment[];
  totalComments: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  sort?: 'top' | 'new' | 'controversial';
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

export interface CreateCommentResponse {
  message: string;
  comment: Comment;
}

export interface VoteRequest {
  voteType: 'upvote' | 'downvote';
}

export interface VoteResponse {
  message: string;
  userVote: 'upvote' | 'downvote' | null;
  newCounts: {
    upvotes: number;
    downvotes: number;
    voteScore: number;
  };
}

export interface CommentContextType {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  totalComments: number;
  currentSort: 'top' | 'new' | 'controversial';
  fetchComments: (movieId: number, sort?: string) => Promise<void>;
  createComment: (movieId: number, content: string, parentCommentId?: number) => Promise<void>;
  voteOnComment: (commentId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
  removeVote: (commentId: number) => Promise<void>;
  editComment: (commentId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  loadMoreReplies: (commentId: number) => Promise<void>;
}