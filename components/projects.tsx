import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { TrashIcon, EditIcon, Circle, CheckCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { DotsPattern } from './ui/dotspattern';
import { toast } from 'sonner';

interface Subtask {
    id: number;
    title: string;
    completed: boolean;
}

interface Task {
    id: number;
    title: string;
    status: 'To Do' | 'In Progress' | 'In Review' | 'Complete';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    due_date: string;
    assignees: string[];
    description: string;
    subtasks: Subtask[];
    time_tracked: number;
    project: string;
    tags: string[];
    dependencies: number[];
    recurrence: string | null;
    importance: number;
    urgency: number;
    user_id: string;
    created_at?: string;
}

interface Project {
    id: number;
    name: string;
    color: string;
    user_id: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

interface ProjectsProps {
    projects: Project[];
    tasks: Task[];
    addProject: (
        name: string,
        color: string,
        description: string
    ) => Promise<void>;
    updateProject: (
        id: number,
        name: string,
        color: string,
        description: string
    ) => Promise<void>;
    deleteProject: (id: number) => Promise<void>;
}

export default function Projects({
    projects,
    tasks,
    addProject,
    updateProject,
    deleteProject,
}: ProjectsProps) {
    // State variables for adding a new project
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#ffffff');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [loadingAddProject, setLoadingAddProject] = useState(false);

    // State variables for editing a project
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editedProjectName, setEditedProjectName] = useState('');
    const [editedProjectColor, setEditedProjectColor] = useState('#000000');
    const [editedProjectDescription, setEditedProjectDescription] = useState('');
    const [loadingEditProject, setLoadingEditProject] = useState(false);

    // State variables for deleting a project
    const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<number | null>(
        null
    );

    // Other state variables
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('name');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Open project details
    const openProjectDetails = (project: Project) => {
        setSelectedProject(project);
    };

    // Close project details
    const closeProjectDetails = () => {
        setSelectedProject(null);
    };

    // Handle add project
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

    // Handle edit button click
    const handleEditButtonClick = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the card click event
        setEditingProject(project);
        setEditedProjectName(project.name);
        setEditedProjectColor(project.color);
        setEditedProjectDescription(project.description || '');
    };

    // Save edited project
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

    // Handle delete button click
    const handleDeleteButtonClick = (projectId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the card click event
        setConfirmDeleteProjectId(projectId);
    };

    // Confirm delete
    const confirmDeleteProject = async () => {
        if (confirmDeleteProjectId !== null) {
            try {
                await deleteProject(confirmDeleteProjectId);
                setConfirmDeleteProjectId(null);

            } catch (error) {
                console.error('Error deleting project:', error);
                toast.error('Failed to delete project.');
            }
        }
    };



    // Cancel delete
    const cancelDeleteProject = () => {
        setConfirmDeleteProjectId(null);
    };

    const getProjectProgress = (projectName: string) => {
        const totalTasks = tasks.filter((t) => t.project === projectName).length;
        const completedTasks = tasks.filter(
            (t) => t.project === projectName && t.status === 'Complete'
        ).length;
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    };

    const filteredProjects = useMemo(() => {
        let result = [...projects];
        if (searchQuery) {
            result = result.filter((project) =>
                project.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (sortOption === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === 'date') {
            result.sort(
                (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            );
        }
        return result;
    }, [projects, searchQuery, sortOption]);


    return (
        <div>
            {/* Search and Sort Controls */}
            <div className="flex items-center justify-between mb-4">
                <Input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                />
                <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date Created</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                    Add New Project
                </Button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                    <Card
                        key={project.id}
                        onClick={() => openProjectDetails(project)}
                        className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
                    >
                        <DotsPattern
                            className={cn(
                                "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
                            )}
                        />
                        <div className="relative z-10 p-6 space-y-4">
                            <CardHeader className="flex justify-between items-center">
                                <CardTitle style={{ color: project.color }}>{project.name}</CardTitle>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleEditButtonClick(project, e)}
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleDeleteButtonClick(project.id, e)}
                                    >
                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p>Total Tasks: {tasks.filter((t) => t.project === project.name).length}</p>
                                <p>
                                    Completed Tasks:{' '}
                                    {
                                        tasks.filter(
                                            (t) => t.project === project.name && t.status === 'Complete'
                                        ).length
                                    }
                                </p>
                                <div className="mt-2">
                                    <p>Progress:</p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${getProjectProgress(project.name)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm mt-1">{getProjectProgress(project.name)}% Complete</p>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add New Project Dialog */}
            <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Project</DialogTitle>
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

            {/* Edit Project Dialog */}
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

            {/* Confirm Delete Dialog */}
            <Dialog open={confirmDeleteProjectId !== null} onOpenChange={cancelDeleteProject}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this project? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="destructive" onClick={confirmDeleteProject}>
                            Delete
                        </Button>
                        <Button variant="secondary" onClick={cancelDeleteProject}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Details Dialog */}
            {selectedProject && (
                <Dialog open={selectedProject !== null} onOpenChange={closeProjectDetails}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle style={{ color: selectedProject.color }}>
                                {selectedProject.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Tasks</h3>
                            <ul className="space-y-4">
                                {tasks
                                    .filter((t) => t.project === selectedProject.name)
                                    .map((task) => (
                                        <Card
                                            key={task.id}
                                            className="shadow hover:shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer border-l-4"
                                            style={{
                                                borderColor: selectedProject.color,
                                                backgroundImage: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                                            }}
                                            onClick={() => toast.success(`Task "${task.title}" has been clicked.`)}
                                        >
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="flex items-center space-x-2">
                                                    {/* Status Icon */}
                                                    {task.status === 'Complete' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-yellow-500" />
                                                    )}
                                                    <span className="font-medium text-gray-800">{task.title}</span>
                                                </div>
                                                <Badge variant={task.status === 'Complete' ? 'success' : 'secondary'}>
                                                    {task.status}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </ul>
                        </div>
                        <DialogFooter>
                            <Button onClick={closeProjectDetails}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
