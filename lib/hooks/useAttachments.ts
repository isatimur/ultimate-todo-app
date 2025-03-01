import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { AttachmentService } from '@/lib/services/attachments';
import { Attachment } from '@/lib/types';
import { useUser } from './useUser';

export function useAttachments(taskId: string) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useUser();

    useEffect(() => {
        let mounted = true;

        const fetchAttachments = async () => {
            try {
                const data = await AttachmentService.getAttachments(taskId);
                if (mounted) {
                    setAttachments(data);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch attachments'));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAttachments();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel(`attachments:${taskId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'attachments',
                filter: `task_id=eq.${taskId}`
            }, (payload) => {
                if (!mounted) return;

                if (payload.eventType === 'INSERT') {
                    setAttachments(prev => [...prev, payload.new as Attachment]);
                } else if (payload.eventType === 'DELETE') {
                    setAttachments(prev => prev.filter(a => a.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [taskId]);

    const uploadAttachment = async (file: File) => {
        if (!user) throw new Error('User must be authenticated');
        
        try {
            const newAttachment = await AttachmentService.uploadAttachment(taskId, file, user.id);
            return newAttachment;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to upload attachment'));
            throw err;
        }
    };

    const deleteAttachment = async (attachmentId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            await AttachmentService.deleteAttachment(attachmentId, user.id);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to delete attachment'));
            throw err;
        }
    };

    const getPublicUrl = (filePath: string) => {
        return AttachmentService.getPublicUrl(filePath);
    };

    return {
        attachments,
        isLoading,
        error,
        uploadAttachment,
        deleteAttachment,
        getPublicUrl
    };
} 