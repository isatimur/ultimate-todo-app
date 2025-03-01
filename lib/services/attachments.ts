import { supabase } from '@/lib/supabase-browser';
import { Attachment } from '@/lib/types';

export class AttachmentService {
    static async uploadAttachment(
        taskId: string,
        file: File,
        userId: string
    ): Promise<Attachment> {
        try {
            // First, upload the file to storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${taskId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Then create the attachment record
            const { data, error } = await supabase
                .from('attachments')
                .insert({
                    task_id: taskId,
                    file_path: filePath,
                    file_name: file.name,
                    file_size: file.size,
                    content_type: file.type,
                    uploaded_by: userId
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error uploading attachment:', error);
            throw error;
        }
    }

    static async getAttachments(taskId: string): Promise<Attachment[]> {
        try {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching attachments:', error);
            throw error;
        }
    }

    static async deleteAttachment(id: string, userId: string): Promise<void> {
        try {
            // First verify ownership through the task
            const { data: attachment, error: fetchError } = await supabase
                .from('attachments')
                .select('file_path, uploaded_by')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (attachment.uploaded_by !== userId) {
                throw new Error('Unauthorized to delete this attachment');
            }

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('attachments')
                .remove([attachment.file_path]);

            if (storageError) throw storageError;

            // Delete record
            const { error } = await supabase
                .from('attachments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting attachment:', error);
            throw error;
        }
    }

    static getPublicUrl(filePath: string): string {
        const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
}
