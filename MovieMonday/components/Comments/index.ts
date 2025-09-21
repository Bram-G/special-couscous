export { default as CommentSection } from './CommentSection';
export { default as CommentList } from './CommentList';
export { default as CommentItem } from './CommentItem';
export { default as CommentForm } from './CommentForm';

// Export types for easy importing
export type { 
  Comment, 
  CommentSection as CommentSectionType, 
  CommentAuthor,
  CreateCommentRequest,
  CreateCommentResponse,
  VoteRequest,
  VoteResponse 
} from '@/types/comments';