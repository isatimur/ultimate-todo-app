import { supabase } from '@/lib/supabase-browser';
import { TaskTemplate } from '@/lib/types';

export class TemplateService {
    static async getTemplates(
        userId: string,
        options?: {
            search?: string;
            category?: string;
            tags?: string[];
            sortBy?: 'name' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used';
            sortOrder?: 'asc' | 'desc';
        }
    ) {
        try {
            let query = supabase
                .from('task_templates')
                .select(`
                    *,
                    user:profiles!created_by(
                        full_name,
                        avatar_url
                    )
                `)
                .or(`created_by.eq.${userId},permissions->canView.cs.{${userId}},isPublic.eq.true`);

            // Apply search filter
            if (options?.search) {
                query = query.or(
                    `name.ilike.%${options.search}%,description.ilike.%${options.search}%`
                );
            }

            // Apply category filter
            if (options?.category) {
                query = query.eq('category', options.category);
            }

            // Apply tags filter
            if (options?.tags?.length) {
                query = query.contains('tags', options.tags);
            }

            // Apply sorting
            if (options?.sortBy) {
                query = query.order(
                    options.sortBy,
                    { ascending: options.sortOrder === 'asc' }
                );
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    }

    static async getCategories(userId: string) {
        try {
            const { data, error } = await supabase
                .from('task_templates')
                .select('category')
                .or(`created_by.eq.${userId},permissions->canView.cs.{${userId}},isPublic.eq.true`)
                .not('category', 'is', null);

            if (error) throw error;

            // Get unique categories
            const categories = Array.from(new Set(
                data
                    .map(template => template.category)
                    .filter(Boolean)
            ));

            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    static async getTags(userId: string) {
        try {
            const { data, error } = await supabase
                .from('task_templates')
                .select('tags')
                .or(`created_by.eq.${userId},permissions->canView.cs.{${userId}},isPublic.eq.true`);

            if (error) throw error;

            // Get unique tags
            const tags = Array.from(new Set(
                data
                    .flatMap(template => template.tags || [])
                    .filter(Boolean)
            ));

            return tags;
        } catch (error) {
            console.error('Error fetching tags:', error);
            throw error;
        }
    }

    static async getTemplate(templateId: string, userId: string) {
        try {
            const { data, error } = await supabase
                .from('task_templates')
                .select(`
                    *,
                    tasks,
                    user:profiles!created_by(
                        full_name,
                        avatar_url
                    )
                `)
                .eq('id', templateId)
                .or(`created_by.eq.${userId},permissions->canView.cs.{${userId}},isPublic.eq.true`)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching template:', error);
            throw error;
        }
    }

    static async createTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const { data, error } = await supabase
                .from('task_templates')
                .insert({
                    name: template.name,
                    description: template.description,
                    tasks: template.tasks,
                    team_id: template.teamId,
                    created_by: template.createdBy,
                    is_public: template.isPublic,
                    permissions: template.permissions,
                    tags: template.tags,
                    category: template.category,
                    version: 1,
                    usage_count: 0,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    static async updateTemplate(
        templateId: string,
        template: Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
        userId: string
    ) {
        try {
            // Check permissions
            const { data: existingTemplate, error: fetchError } = await supabase
                .from('task_templates')
                .select('created_by, permissions')
                .eq('id', templateId)
                .single();

            if (fetchError) throw fetchError;

            const canEdit = existingTemplate.created_by === userId ||
                (existingTemplate.permissions?.canEdit || []).includes(userId);

            if (!canEdit) {
                throw new Error('You do not have permission to edit this template');
            }

            // Update template
            const { data, error } = await supabase
                .from('task_templates')
                .update({
                    name: template.name,
                    description: template.description,
                    tasks: template.tasks,
                    team_id: template.teamId,
                    is_public: template.isPublic,
                    permissions: template.permissions,
                    tags: template.tags,
                    category: template.category,
                    version: supabase.sql`version + 1`,
                })
                .eq('id', templateId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }

    static async deleteTemplate(templateId: string, userId: string) {
        try {
            // Check permissions
            const { data: template, error: fetchError } = await supabase
                .from('task_templates')
                .select('created_by, permissions')
                .eq('id', templateId)
                .single();

            if (fetchError) throw fetchError;

            const canDelete = template.created_by === userId ||
                (template.permissions?.canEdit || []).includes(userId);

            if (!canDelete) {
                throw new Error('You do not have permission to delete this template');
            }

            const { error } = await supabase
                .from('task_templates')
                .delete()
                .eq('id', templateId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    }

    static async shareTemplate(
        templateId: string,
        userId: string,
        shareWith: { userId: string; permissions: ('view' | 'edit' | 'share')[] }[]
    ) {
        try {
            // Check sharing permissions
            const { data: template, error: fetchError } = await supabase
                .from('task_templates')
                .select('created_by, permissions')
                .eq('id', templateId)
                .single();

            if (fetchError) throw fetchError;

            const canShare = template.created_by === userId ||
                (template.permissions?.canShare || []).includes(userId);

            if (!canShare) {
                throw new Error('You do not have permission to share this template');
            }

            // Update permissions
            const newPermissions = { ...template.permissions };
            for (const share of shareWith) {
                if (share.permissions.includes('view')) {
                    newPermissions.canView = [...new Set([...newPermissions.canView, share.userId])];
                }
                if (share.permissions.includes('edit')) {
                    newPermissions.canEdit = [...new Set([...newPermissions.canEdit, share.userId])];
                }
                if (share.permissions.includes('share')) {
                    newPermissions.canShare = [...new Set([...newPermissions.canShare, share.userId])];
                }
            }

            const { data, error } = await supabase
                .from('task_templates')
                .update({ permissions: newPermissions })
                .eq('id', templateId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error sharing template:', error);
            throw error;
        }
    }

    static async createTaskFromTemplate(templateId: string, userId: string) {
        try {
            // Check view permissions
            const template = await this.getTemplate(templateId, userId);
            if (!template) throw new Error('Template not found or no access');

            // Update usage statistics
            await supabase
                .from('task_templates')
                .update({
                    usage_count: supabase.sql`usage_count + 1`,
                    last_used: new Date().toISOString()
                })
                .eq('id', templateId);

            // Create tasks from template
            const tasks = template.tasks.map((task: any) => ({
                ...task,
                user_id: userId,
                team_id: template.teamId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));

            const { data, error } = await supabase
                .from('tasks')
                .insert(tasks)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating tasks from template:', error);
            throw error;
        }
    }

    static async previewTemplate(templateId: string, userId: string) {
        try {
            const template = await this.getTemplate(templateId, userId);
            if (!template) throw new Error('Template not found or no access');

            // Get sample tasks created from this template
            const { data: sampleTasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('template_id', templateId)
                .limit(3)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // Get usage statistics
            const { data: stats, error: statsError } = await supabase
                .from('task_templates')
                .select('usage_count, last_used')
                .eq('id', templateId)
                .single();

            if (statsError) throw statsError;

            return {
                template,
                sampleTasks,
                stats: {
                    usageCount: stats.usage_count,
                    lastUsed: stats.last_used,
                }
            };
        } catch (error) {
            console.error('Error previewing template:', error);
            throw error;
        }
    }

    static async exportTemplate(templateId: string, userId: string) {
        try {
            const template = await this.getTemplate(templateId, userId);
            if (!template) throw new Error('Template not found or no access');

            // Remove sensitive information
            const exportData = {
                name: template.name,
                description: template.description,
                tasks: template.tasks.map(task => ({
                    title: task.title,
                    description: task.description,
                    checklist: task.checklist,
                    estimatedTime: task.estimatedTime,
                    priority: task.priority,
                    category: task.category,
                    dueDate: task.dueDate,
                })),
                category: template.category,
                tags: template.tags,
                version: template.version,
                exportedAt: new Date().toISOString(),
            };

            return exportData;
        } catch (error) {
            console.error('Error exporting template:', error);
            throw error;
        }
    }

    static async importTemplate(
        importData: any,
        userId: string,
        options?: {
            teamId?: string;
            isPublic?: boolean;
        }
    ) {
        try {
            // Validate import data
            if (!this.validateImportData(importData)) {
                throw new Error('Invalid template data');
            }

            // Create template
            const template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
                name: importData.name,
                description: importData.description,
                tasks: importData.tasks,
                teamId: options?.teamId,
                createdBy: userId,
                isPublic: options?.isPublic || false,
                permissions: {
                    canView: [],
                    canEdit: [],
                    canShare: []
                },
                tags: importData.tags || [],
                category: importData.category,
                version: 1,
                usageCount: 0,
            };

            const { data, error } = await supabase
                .from('task_templates')
                .insert(template)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error importing template:', error);
            throw error;
        }
    }

    private static validateImportData(data: any): boolean {
        // Basic validation
        if (!data.name || !data.tasks || !Array.isArray(data.tasks)) {
            return false;
        }

        // Validate tasks
        for (const task of data.tasks) {
            if (!task.title) return false;
            if (task.checklist && !Array.isArray(task.checklist)) return false;
            if (task.priority && !['Low', 'Medium', 'High'].includes(task.priority)) return false;
            if (task.category && !['Work', 'Personal', 'Errands'].includes(task.category)) return false;
        }

        return true;
    }

    static async duplicateTemplate(templateId: string, userId: string, options?: {
        teamId?: string;
        isPublic?: boolean;
    }) {
        try {
            const template = await this.getTemplate(templateId, userId);
            if (!template) throw new Error('Template not found or no access');

            const duplicateData = {
                name: `${template.name} (Copy)`,
                description: template.description,
                tasks: template.tasks,
                teamId: options?.teamId || template.teamId,
                createdBy: userId,
                isPublic: options?.isPublic ?? template.isPublic,
                permissions: {
                    canView: [],
                    canEdit: [],
                    canShare: []
                },
                tags: template.tags,
                category: template.category,
                version: 1,
                usageCount: 0,
            };

            const { data, error } = await supabase
                .from('task_templates')
                .insert(duplicateData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error duplicating template:', error);
            throw error;
        }
    }
} 