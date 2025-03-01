import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onClose: () => void;
}

export function useKeyboardShortcuts({
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onClose,
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input or textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Command/Ctrl + E to edit
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                if (!isEditing) {
                    onEdit();
                }
            }

            // Command/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (isEditing) {
                    onSave();
                }
            }

            // Escape to cancel editing or close modal
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isEditing) {
                    onCancel();
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, onEdit, onSave, onCancel, onClose]);
} 