import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
    url: string;
    fileName: string;
    contentType: string;
    className?: string;
}

export function FilePreview({ url, fileName, contentType, className }: FilePreviewProps) {
    const [isOpen, setIsOpen] = useState(false);

    const isImage = contentType.startsWith('image/');
    const isPDF = contentType === 'application/pdf';
    const isVideo = contentType.startsWith('video/');
    const isAudio = contentType.startsWith('audio/');

    const renderPreview = () => {
        if (isImage) {
            return (
                <img
                    src={url}
                    alt={fileName}
                    className="max-w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsOpen(true)}
                />
            );
        }

        if (isPDF) {
            return (
                <div className="relative group" onClick={() => setIsOpen(true)}>
                    <div className="bg-muted rounded-md p-4 cursor-pointer group-hover:bg-muted/80 transition-colors">
                        <Icons.file className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium truncate">{fileName}</p>
                    </div>
                </div>
            );
        }

        if (isVideo) {
            return (
                <video
                    src={url}
                    controls
                    className="max-w-full rounded-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (isAudio) {
            return (
                <audio
                    src={url}
                    controls
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    Your browser does not support the audio tag.
                </audio>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-muted rounded-md p-4 hover:bg-muted/80 transition-colors">
                    <Icons.file className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium truncate">{fileName}</p>
                </div>
            </a>
        );
    };

    return (
        <>
            <div className={cn("relative", className)}>
                {renderPreview()}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>{fileName}</DialogTitle>
                        <DialogDescription>
                            Preview the file content. You can download or view it in a new tab.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto p-6">
                        {isImage && (
                            <img
                                src={url}
                                alt={fileName}
                                className="max-w-full h-auto mx-auto"
                            />
                        )}
                        {isPDF && (
                            <iframe
                                src={`${url}#view=FitH`}
                                className="w-full h-full min-h-[500px]"
                                title={fileName}
                            />
                        )}
                        {isVideo && (
                            <video
                                src={url}
                                controls
                                className="max-w-full mx-auto"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                        {isAudio && (
                            <audio
                                src={url}
                                controls
                                className="w-full"
                            >
                                Your browser does not support the audio tag.
                            </audio>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 