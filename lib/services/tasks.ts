import { supabase } from '@/lib/supabase-browser';
import { TaskType } from '@/lib/types';
import { getCachedData } from '@/lib/cache';

export class TaskService {
    static async getTasks(userId: string, teamId?: string) {
        const cacheKey = `tasks_${userId}_${teamId || 'personal'}`;

        return getCachedData(cacheKey, async () => {
            const query = supabase
                .from('tasks')
                .select(`
                    *,
                    subtasks (*),
                    comments (
                        *,
                        user:profiles (*)
                    ),
                    assignees:task_assignees (
                        user:profiles (*)
                    ),
                    attachments (*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (teamId) {
                query.eq('team_id', teamId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        });
    }

    static async createTask(task: Omit<TaskType, 'id'>, userId: string) {
        const { data, error } = await supabase
            .from('tasks')
            .insert({ ...task, user_id: userId })
            .select(`
                *,
                subtasks (*),
                comments (*),
                assignees:task_assignees (
                    user:profiles (*)
                )
            `)
            .single();

        if (error) throw error;
        return data;
    }

    static async updateTask(taskId: number, updates: Partial<TaskType>, userId: string) {
        // First verify ownership
        const { data: existingTask, error: verifyError } = await supabase
            .from('tasks')
            .select('user_id')
            .eq('id', taskId)
            .single();

        if (verifyError) throw verifyError;
        if (existingTask.user_id !== userId) {
            throw new Error('Unauthorized to update this task');
        }

        const { data, error } = await supabase
            .from('tasks')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', taskId)
            .select(`
                *,
                subtasks (*),
                comments (*),
                assignees:task_assignees (
                    user:profiles (*)
                )
            `)
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteTask(taskId: number, userId: string) {
        // First verify ownership
        const { data: existingTask, error: verifyError } = await supabase
            .from('tasks')
            .select('user_id')
            .eq('id', taskId)
            .single();

        if (verifyError) throw verifyError;
        if (existingTask.user_id !== userId) {
            throw new Error('Unauthorized to delete this task');
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    }

    static async updateSubtasks(taskId: number, subtasks: any[], userId: string) {
        // First verify task ownership
        const { data: existingTask, error: verifyError } = await supabase
            .from('tasks')
            .select('user_id')
            .eq('id', taskId)
            .single();

        if (verifyError) throw verifyError;
        if (existingTask.user_id !== userId) {
            throw new Error('Unauthorized to update subtasks');
        }

        const { error } = await supabase
            .from('subtasks')
            .upsert(
                subtasks.map(st => ({
                    ...st,
                    task_id: taskId,
                    updated_at: new Date().toISOString()
                }))
            );

        if (error) throw error;
    }

    static subscribeToTasks(userId: string, onUpdate: (payload: any) => void) {
        return supabase
            .channel('tasks-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `user_id=eq.${userId}`
                },
                onUpdate
            )
            .subscribe();
    }
}
