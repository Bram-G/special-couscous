'use client';

import React, { useState } from 'react';
import {
  Textarea,
  Button,
  Card,
  CardBody,
} from '@heroui/react';
import { Send, X } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showCancel?: boolean;
  onCancel?: () => void;
}

export default function CommentForm({
  onSubmit,
  loading = false,
  placeholder = "Share your thoughts...",
  size = 'md',
  showCancel = false,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (content.trim().length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }

    if (content.trim().length > 1000) {
      setError('Comment cannot exceed 1000 characters');
      return;
    }

    setError('');

    try {
      await onSubmit(content.trim());
      setContent(''); // Clear form on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    onCancel?.();
  };

  // Get sizes based on size prop
  const textareaProps = {
    sm: {
      minRows: 2,
      className: 'text-sm',
    },
    md: {
      minRows: 3,
      className: '',
    },
    lg: {
      minRows: 4,
      className: 'text-base',
    },
  }[size];

  const buttonSize = size === 'sm' ? 'sm' : 'md';

  return (
    <Card>
      <CardBody className="space-y-3">
        <Textarea
          placeholder={placeholder}
          value={content}
          onValueChange={setContent}
          minRows={textareaProps.minRows}
          className={textareaProps.className}
          variant="bordered"
          isInvalid={!!error}
          errorMessage={error}
          description={
            <div className="flex justify-between items-center text-tiny">
              <span>
                {content.length < 10 
                  ? `${10 - content.length} more characters needed`
                  : `${content.length}/1000 characters`
                }
              </span>
              {content.length > 0 && (
                <span className={content.length > 1000 ? 'text-danger' : 'text-success'}>
                  {content.length > 1000 ? 'Too long!' : 'Good to go!'}
                </span>
              )}
            </div>
          }
        />

        <div className="flex justify-between items-center">
          <div className="text-tiny text-default-400">
            Be respectful and constructive in your comments
          </div>

          <div className="flex gap-2">
            {showCancel && (
              <Button
                size={buttonSize}
                variant="light"
                onPress={handleCancel}
                startContent={<X className="h-4 w-4" />}
                isDisabled={loading}
              >
                Cancel
              </Button>
            )}
            
            <Button
              size={buttonSize}
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
              isDisabled={content.trim().length < 10 || content.length > 1000}
              startContent={!loading && <Send className="h-4 w-4" />}
            >
              {loading ? 'Posting...' : (size === 'sm' ? 'Reply' : 'Post Comment')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}