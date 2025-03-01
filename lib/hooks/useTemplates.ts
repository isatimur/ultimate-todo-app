import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { TemplateService } from '@/lib/services/templates';
import { TaskTemplate } from '@/lib/types';
import { useUser } from './useUser';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface RealtimePayload {
    new: {
        id: string;
        created_by: string;
        is_public: boolean;
        permissions?: {
            canView: string[];
            canEdit: string[];
            canShare: string[];
        };
        [key: string]: any;
    };
    old: {
        id: string;
        [key: string]: any;
    };
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

interface UseTemplatesOptions {
    search?: string;
    category?: string;
    tags?: string[];
    sortBy?: 'name' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used';
    sortOrder?: 'asc' | 'desc';
}

export function useTemplates(options?: UseTemplatesOptions) {
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useUser();

    const debouncedSearch = useDebounce(options?.search, 300);

    const fetchTemplates = useCallback(async () => {
        if (!user) return;

        try {
            const data = await TemplateService.getTemplates(user.id, {
                ...options,
                search: debouncedSearch
            });
            setTemplates(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
        } finally {
            setIsLoading(false);
        }
    }, [user, debouncedSearch, options]);

    const fetchMetadata = useCallback(async () => {
        if (!user) return;

        try {
            const [categoriesData, tagsData] = await Promise.all([
                TemplateService.getCategories(user.id),
                TemplateService.getTags(user.id)
            ]);
            setCategories(categoriesData);
            setTags(tagsData);
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    }, [user]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (mounted) {
                await fetchTemplates();
                await fetchMetadata();
            }
        };

        init();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('task_templates_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'task_templates',
            }, async (payload: RealtimePayload) => {
                if (!mounted || !user) return;

                // Check if user has access to the template
                const hasAccess = payload.new.created_by === user.id ||
                    payload.new.is_public ||
                    (payload.new.permissions?.canView || []).includes(user.id);

                // Refresh the list to ensure filters are applied
                if (hasAccess || payload.eventType === 'DELETE') {
                    await fetchTemplates();
                    await fetchMetadata();
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [user, fetchTemplates, fetchMetadata]);

    const createTemplate = async (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const newTemplate = await TemplateService.createTemplate({
                ...template,
                createdBy: user.id,
                isPublic: false,
                permissions: {
                    canView: [],
                    canEdit: [],
                    canShare: []
                },
                tags: template.tags || [],
                version: 1,
                usageCount: 0
            });
            return newTemplate;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create template'));
            throw err;
        }
    };

    const updateTemplate = async (
        templateId: string,
        template: Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const updatedTemplate = await TemplateService.updateTemplate(templateId, template, user.id);
            return updatedTemplate;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update template'));
            throw err;
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            await TemplateService.deleteTemplate(templateId, user.id);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to delete template'));
            throw err;
        }
    };

    const shareTemplate = async (
        templateId: string,
        shareWith: { userId: string; permissions: ('view' | 'edit' | 'share')[] }[]
    ) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const updatedTemplate = await TemplateService.shareTemplate(templateId, user.id, shareWith);
            return updatedTemplate;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to share template'));
            throw err;
        }
    };

    const createTaskFromTemplate = async (templateId: string) => {
        if (!user) throw new Error('User must be authenticated');

        try {
            const tasks = await TemplateService.createTaskFromTemplate(templateId, user.id);
            return tasks;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create task from template'));
            throw err;
        }
    };

    const hasPermission = (template: TaskTemplate, permission: 'view' | 'edit' | 'share') => {
        if (!user) return false;
        if (template.createdBy === user.id) return true;
        if (template.isPublic && permission === 'view') return true;

        switch (permission) {
            case 'view':
                return template.permissions.canView.includes(user.id);
            case 'edit':
                return template.permissions.canEdit.includes(user.id);
            case 'share':
                return template.permissions.canShare.includes(user.id);
            default:
                return false;
        }
    };

    return {
        templates,
        categories,
        tags,
        isLoading,
        error,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        shareTemplate,
        createTaskFromTemplate,
        hasPermission,
        refresh: fetchTemplates
    };
}