import { supabase } from '@/lib/supabase-browser';
import { Comment } from '@/lib/types';

export class CommentService {
    static async addComment(
        taskId: string,
        content: string,
        userId: string
    ): Promise<Comment> {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    task_id: taskId,
                    user_id: userId,
                    content
                })
                .select(`
                    *,
                    user:profiles (*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    static async updateComment(
        id: string,
        content: string,
        userId: string
    ): Promise<Comment> {
        try {
            const { data, error } = await supabase
                .from('comments')
                .update({
                    content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', userId) // Ensure user owns the comment
                .select(`
                    *,
                    user:profiles (*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating comment:', error);
            throw error;
        }
    }

    static async deleteComment(id: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', id)
                .eq('user_id', userId); // Ensure user owns the comment

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    static async getComments(taskId: string): Promise<Comment[]> {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:profiles (*)
                `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }
}
