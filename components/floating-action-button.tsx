import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CreateTaskDialog } from "./create-task-dialog"
import { Task } from "@/lib/types"
import { useHotkeys } from "react-hotkeys-hook"
import { useState } from "react"
import { toast } from "sonner"

interface FloatingActionButtonProps {
    onCreateTask: (task: Omit<Task, "id">) => Promise<void>;
}

export function FloatingActionButton({ onCreateTask }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Ctrl/Cmd + N to open create task dialog
    useHotkeys('ctrl+n, cmd+n', (e) => {
        e.preventDefault();
        setIsOpen(true);
    });

    const handleCreateTask = async (task: Omit<Task, "id">) => {
        try {
            await onCreateTask(task);
            setIsOpen(false);
            toast.success("Task created successfully");
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new task. Press Enter to save or Escape to cancel.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateTaskDialog 
                        open={isOpen} 
                        onOpenChange={setIsOpen} 
                        onCreateTask={handleCreateTask} 
                    />
                </DialogContent>
            </Dialog>

            <Button
                size="lg"
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Create new task</span>
            </Button>
        </>
    );
} 