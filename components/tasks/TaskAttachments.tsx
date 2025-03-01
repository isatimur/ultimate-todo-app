import { useState, useRef } from 'react';
import { useAttachments } from '@/lib/hooks/useAttachments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import { formatFileSize } from '@/lib/utils';
import { FilePreview } from '@/components/ui/file-preview';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TaskAttachmentsProps {
    taskId: string;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
    const {
        attachments,
        isLoading,
        error,
        uploadAttachment,
        deleteAttachment,
        getPublicUrl
    } = useAttachments(taskId);

    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = async (fileList: FileList) => {
        const files = Array.from(fileList);
        if (!files.length) return;

        const newUploadingFiles = files.map(file => ({
            id: Math.random().toString(36).slice(2),
            file,
            progress: 0
        }));

        setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

        for (const uploadingFile of newUploadingFiles) {
            try {
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadingFiles(prev =>
                        prev.map(f =>
                            f.id === uploadingFile.id
                                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                                : f
                        )
                    );
                }, 200);

                await uploadAttachment(uploadingFile.file);

                clearInterval(progressInterval);
                setUploadingFiles(prev =>
                    prev.map(f =>
                        f.id === uploadingFile.id ? { ...f, progress: 100 } : f
                    )
                );

                // Remove completed upload after a short delay
                setTimeout(() => {
                    setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
                }, 1000);

                toast({
                    title: 'File uploaded',
                    description: `${uploadingFile.file.name} has been uploaded successfully.`
                });
            } catch (err) {
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
                toast({
                    title: 'Upload failed',
                    description: err instanceof Error ? err.message : 'Failed to upload file',
                    variant: 'destructive'
                });
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        await handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDelete = async (attachmentId: string, fileName: string) => {
        try {
            await deleteAttachment(attachmentId);
            toast({
                title: 'File deleted',
                description: `${fileName} has been deleted.`
            });
        } catch (err) {
            toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Failed to delete file',
                variant: 'destructive'
            });
        }
    };

    if (error) {
        return (
            <div className="p-4 text-red-500">
                <p>Error loading attachments: {error.message}</p>
            </div>
        );
    }

    return (
        <div
            className="space-y-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Attachments</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                        multiple
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFiles.length > 0}
                        variant="outline"
                        size="sm"
                    >
                        <Icons.upload className="mr-2 h-4 w-4" />
                        Upload Files
                    </Button>
                </div>
            </div>

            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((file) => (
                        <Card key={file.id} className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{file.file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {file.progress}%
                                    </p>
                                </div>
                                <Progress value={file.progress} />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Card
                className={cn(
                    "border-2 border-dashed p-8 text-center",
                    dragOver && "border-primary bg-primary/5",
                    !dragOver && "border-muted"
                )}
            >
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                    <Icons.upload className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                        Drag and drop your files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Supports images, documents, audio, and video files
                    </p>
                </div>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                </div>
            ) : attachments.length === 0 ? (
                <Card className="flex items-center justify-center p-8 text-muted-foreground">
                    <p>No attachments yet</p>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {attachments.map((attachment) => (
                        <Card key={attachment.id} className="p-4">
                            <div className="space-y-2">
                                <FilePreview
                                    url={getPublicUrl(attachment.file_path)}
                                    fileName={attachment.file_name}
                                    contentType={attachment.content_type}
                                />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium truncate">
                                            {attachment.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(attachment.file_size)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(attachment.id, attachment.file_name)}
                                    >
                                        <Icons.trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 