'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    CheckCircle, Circle, EditIcon, TrashIcon,
    FolderIcon, GridIcon, ListIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { DotsPattern } from './ui/dotspattern';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { format } from 'date-fns';
import { TaskType } from '@/lib/types';

export interface ProjectType {
    id: string;
    name: string;
    description: string | null;
    color: string;
    user_id: string;
    team_id?: string;
    created_at: string;
    updated_at: string | null;
}

interface ProjectStats {
    total: number;
    completed: number;
    progress: number;
    timeTracked: number;
    recentActivity: TaskType | null;
}

export interface ProjectsProps {
    projects: ProjectType[];
    tasks: TaskType[];
    addProject: (name: string, color: string, description: string) => Promise<void>;
    updateProject: (id: string, name: string, color: string, description: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export default function Projects({
    projects,
    tasks,
    addProject,
    updateProject,
    deleteProject,
}: ProjectsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#ffffff');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [editedProjectName, setEditedProjectName] = useState('');
    const [editedProjectColor, setEditedProjectColor] = useState('#ffffff');
    const [editedProjectDescription, setEditedProjectDescription] = useState('');
    const [loadingAddProject, setLoadingAddProject] = useState(false);
    const [loadingEditProject, setLoadingEditProject] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'tasks' | 'recent'>('recent');

    const getProjectStats = useCallback((projectName: string) => {
        const projectTasks = tasks.filter((t) => t.project === projectName);
        const completedTasks = projectTasks.filter((t) => t.status === 'Complete');
        const totalTime = projectTasks.reduce((acc, t) => acc + (t.time_tracked || 0), 0);

        return {
            total: projectTasks.length,
            completed: completedTasks.length,
            progress: projectTasks.length > 0
                ? Math.round((completedTasks.length / projectTasks.length) * 100)
                : 0,
            timeTracked: totalTime,
            recentActivity: projectTasks.sort((a, b) =>
                new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            )[0]
        };
    }, [tasks]);

    const filteredProjects = useMemo(() => {
        return projects.filter((project) =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const sortedProjects = useMemo(() => {
        let sorted = [...filteredProjects];
        switch (sortBy) {
            case 'progress':
                sorted.sort((a, b) =>
                    getProjectStats(b.name).progress - getProjectStats(a.name).progress
                );
                break;
            case 'tasks':
                sorted.sort((a, b) =>
                    getProjectStats(b.name).total - getProjectStats(a.name).total
                );
                break;
            case 'recent':
                sorted.sort((a, b) =>
                    new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
                );
                break;
            default:
                sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        return sorted;
    }, [filteredProjects, getProjectStats, sortBy]);

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAddProject(true);
        try {
            await addProject(newProjectName, newProjectColor, newProjectDescription);
            setNewProjectName('');
            setNewProjectColor('#ffffff');
            setNewProjectDescription('');
            setIsNewProjectDialogOpen(false);
        } catch (error) {
            console.error('Error adding project:', error);
            toast.error('Failed to add project.');
        } finally {
            setLoadingAddProject(false);
        }
    };

    const handleEditButtonClick = (project: ProjectType, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project);
        setEditedProjectName(project.name);
        setEditedProjectColor(project.color);
        setEditedProjectDescription('');
    };

    const saveEditedProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingEditProject(true);
        if (editingProject) {
            try {
                await updateProject(
                    editingProject.id,
                    editedProjectName,
                    editedProjectColor,
                    editedProjectDescription
                );
                setEditingProject(null);
            } catch (error) {
                console.error('Error updating project:', error);
                toast.error('Failed to update project.');
            } finally {
                setLoadingEditProject(false);
            }
        }
    };

    const handleDeleteButtonClick = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteProject(projectId).catch((error) => {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project.');
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">
                        Manage and track your projects
                    </p>
                </div>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="progress">Progress</SelectItem>
                            <SelectItem value="tasks">Tasks</SelectItem>
                            <SelectItem value="recent">Recent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={view === 'grid' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setView('grid')}
                    >
                        <GridIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setView('list')}
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            stats={getProjectStats(project.name)}
                            onEdit={(e) => handleEditButtonClick(project, e)}
                            onDelete={(e) => handleDeleteButtonClick(project.id, e)}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedProjects.map((project) => (
                        <ProjectListItem
                            key={project.id}
                            project={project}
                            stats={getProjectStats(project.name)}
                            onEdit={(e: React.MouseEvent) => handleEditButtonClick(project, e)}
                            onDelete={(e: React.MouseEvent) => handleDeleteButtonClick(project.id, e)}
                        />
                    ))}
                </div>
            )}

            <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Project</DialogTitle>
                        <DialogDescription>
                            Create a new project by entering its details below. Choose a name, color, and optional description.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddProject}>
                        <div className="space-y-2">
                            <Input
                                name="name"
                                placeholder="Project Name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                required
                            />
                            <div className="flex items-center space-x-2">
                                <HexColorPicker color={newProjectColor} onChange={setNewProjectColor} />
                                <Input
                                    name="color"
                                    type="text"
                                    value={newProjectColor}
                                    onChange={(e) => setNewProjectColor(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                            <textarea
                                className="border p-2 rounded w-full"
                                placeholder="Project Description"
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                            />
                            <Button type="submit" disabled={loadingAddProject}>
                                {loadingAddProject ? 'Adding...' : 'Add Project'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {editingProject && (
                <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={saveEditedProject}>
                            <div className="space-y-2">
                                <Input
                                    name="name"
                                    placeholder="Project Name"
                                    value={editedProjectName}
                                    onChange={(e) => setEditedProjectName(e.target.value)}
                                    required
                                />
                                <div className="flex items-center space-x-2">
                                    <HexColorPicker color={editedProjectColor} onChange={setEditedProjectColor} />
                                    <Input
                                        name="color"
                                        type="text"
                                        value={editedProjectColor}
                                        onChange={(e) => setEditedProjectColor(e.target.value)}
                                        className="w-24"
                                    />
                                </div>
                                <textarea
                                    className="border p-2 rounded w-full"
                                    placeholder="Project Description"
                                    value={editedProjectDescription}
                                    onChange={(e) => setEditedProjectDescription(e.target.value)}
                                />
                                <Button type="submit" disabled={loadingEditProject}>
                                    {loadingEditProject ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}


function ProjectCard({ project, stats, onEdit, onDelete }: { project: ProjectType, stats: ProjectStats, onEdit: (e: React.MouseEvent) => void, onDelete: (e: React.MouseEvent) => void }) {
    return (
        <Card
            className="relative overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
        >
            <DotsPattern className={cn(
                "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
                "opacity-25"
            )} />
            <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: project.color }}>
                        {project.name}
                    </h3>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={onEdit}>
                            <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onDelete}>
                            <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Progress value={stats.progress} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Tasks</p>
                            <p className="font-medium">{stats.total}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-medium">{stats.completed}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Time Tracked</p>
                            <p className="font-medium">{Math.round(stats.timeTracked / 60)}h</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Progress</p>
                            <p className="font-medium">{stats.progress}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function ProjectListItem({ project, stats, onEdit, onDelete }: { project: ProjectType, stats: ProjectStats, onEdit: (e: React.MouseEvent) => void, onDelete: (e: React.MouseEvent) => void }) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {stats.total} tasks, {stats.completed} completed
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                    <EditIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                    <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
}
