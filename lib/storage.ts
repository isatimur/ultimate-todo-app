import { supabase } from './supabase-browser';

export async function uploadTaskAttachment(
    taskId: string, 
    file: File
): Promise<string> {
    const path = `tasks/${taskId}/${file.name}`;
    const { data, error } = await supabase.storage
        .from('attachments')
        .upload(path, file);

    if (error) throw error;
    return data.path;
} 