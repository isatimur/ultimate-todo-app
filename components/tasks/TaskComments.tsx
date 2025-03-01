import { useState } from 'react';
import { useComments } from '@/lib/hooks/useComments';
import { useUser } from '@/lib/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/lib/types';

interface TaskCommentsProps {
    taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
    const {
        comments,
        isLoading,
        error,
        addComment,
        updateComment,
        deleteComment
    } = useComments(taskId);

    const { user } = useUser();
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment(newComment.trim());
            setNewComment('');
            toast({
                title: 'Comment added',
                description: 'Your comment has been added successfully.'
            });
        } catch (err) {
            toast({
                title: 'Failed to add comment',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await updateComment(commentId, editContent.trim());
            setEditingComment(null);
            toast({
                title: 'Comment updated',
                description: 'Your comment has been updated successfully.'
            });
        } catch (err) {
            toast({
                title: 'Failed to update comment',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            toast({
                title: 'Comment deleted',
                description: 'Your comment has been deleted.'
            });
        } catch (err) {
            toast({
                title: 'Failed to delete comment',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    if (error) {
        return (
            <div className="p-4 text-red-500">
                <p>Error loading comments: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comments</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={isSubmitting}
                />
                <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? (
                        <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                        </>
                    ) : (
                        'Post Comment'
                    )}
                </Button>
            </form>

            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                </div>
            ) : comments.length === 0 ? (
                <Card className="flex items-center justify-center p-8 text-muted-foreground">
                    <p>No comments yet</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <Card key={comment.id} className="p-4">
                            <div className="flex items-start space-x-4">
                                <Avatar>
                                    <AvatarImage src={comment.user?.avatar_url} />
                                    <AvatarFallback>
                                        {comment.user?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">
                                                {comment.user?.full_name}
                                            </span>
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {user?.id === comment.user_id && (
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEditing(comment)}
                                                >
                                                    <Icons.edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(comment.id)}
                                                >
                                                    <Icons.trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {editingComment === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setEditingComment(null)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={() => handleUpdate(comment.id)}
                                                    disabled={!editContent.trim()}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm">{comment.content}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 