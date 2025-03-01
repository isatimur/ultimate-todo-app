import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { CommentService } from '@/lib/services/comments';
import { Comment } from '@/lib/types';
import { useUser } from './useUser';

export function useComments(taskId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useUser();

    useEffect(() => {
        let mounted = true;

        const fetchComments = async () => {
            try {
                const data = await CommentService.getComments(taskId);
                if (mounted) {
                    setComments(data);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch comments'));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchComments();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel(`comments:${taskId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `task_id=eq.${taskId}`
            }, (payload) => {
                if (!mounted) return;

                if (payload.eventType === 'INSERT') {
                    setComments(prev => [...prev, payload.new as Comment]);
                } else if (payload.eventType === 'UPDATE') {
                    setComments(prev => prev.map(c => 
                        c.id === payload.new.id ? payload.new as Comment : c
                    ));
                } else if (payload.eventType === 'DELETE') {
                    setComments(prev => prev.filter(c => c.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [taskId]);

    const addComment = async (content: string) => {
        if (!user) throw new Error('User must be authenticated');
        
        try {
            const newComment = await CommentService.addComment(taskId, content, user.id);
            return newComment;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to add comment'));
            throw err;
        }
    };

    const updateComment = async (commentId: string, content: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const updatedComment = await CommentService.updateComment(commentId, content, user.id);
            return updatedComment;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update comment'));
            throw err;
        }
    };

    const deleteComment = async (commentId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            await CommentService.deleteComment(commentId, user.id);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to delete comment'));
            throw err;
        }
    };

    return {
        comments,
        isLoading,
        error,
        addComment,
        updateComment,
        deleteComment
    };
} 