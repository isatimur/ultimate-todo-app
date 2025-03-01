import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
}

interface TaskChecklistProps {
    items: ChecklistItem[];
    onChange: (items: ChecklistItem[]) => void;
    disabled?: boolean;
}

export function TaskChecklist({ items, onChange, disabled }: TaskChecklistProps) {
    const [newItemTitle, setNewItemTitle] = useState('');

    const handleAddItem = () => {
        if (!newItemTitle.trim()) return;

        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            title: newItemTitle.trim(),
            completed: false,
        };

        onChange([...items, newItem]);
        setNewItemTitle('');
    };

    const handleToggleItem = (itemId: string) => {
        onChange(
            items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const handleUpdateTitle = (itemId: string, title: string) => {
        onChange(
            items.map((item) =>
                item.id === itemId ? { ...item, title } : item
            )
        );
    };

    const handleDeleteItem = (itemId: string) => {
        onChange(items.filter((item) => item.id !== itemId));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddItem();
        }
    };

    return (
        <div className="space-y-4">
            {!disabled && (
                <div className="flex gap-2">
                    <Input
                        placeholder="Add checklist item..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddItem}
                        disabled={!newItemTitle.trim()}
                    >
                        <Icons.add className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-2 group"
                    >
                        <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleItem(item.id)}
                            disabled={disabled}
                        />
                        {disabled ? (
                            <span
                                className={cn(
                                    'flex-1',
                                    item.completed && 'line-through text-muted-foreground'
                                )}
                            >
                                {item.title}
                            </span>
                        ) : (
                            <Input
                                value={item.title}
                                onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                                className={cn(
                                    'flex-1',
                                    item.completed && 'line-through text-muted-foreground'
                                )}
                            />
                        )}
                        {!disabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icons.trash className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    {items.filter((item) => item.completed).length} of {items.length} completed
                </div>
            )}
        </div>
    );
} 