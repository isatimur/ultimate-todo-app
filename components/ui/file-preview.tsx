"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
    const isAudio = contentType.startsWith('audio/');

    const renderPreview = () => {
        if (isImage) {
            return (
                <div className="relative w-full h-auto cursor-pointer" onClick={() => setIsOpen(true)}>
                    <Image
                        src={url}
                        alt={fileName}
                        width={500}
                        height={300}
                        className="max-w-full h-auto rounded-md hover:opacity-90 transition-opacity"
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            );
        }

        if (isPDF) {
            return (
                <div 
                    className="flex items-center justify-center p-4 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setIsOpen(true)}
                >
                    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3V8h2v8h-2v-2.5h-3V14h-2V8h2v3.5z" />
                    </svg>
                    <span className="ml-2 font-medium">{fileName}</span>
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="w-full">
                    <audio 
                        controls 
                        src={url} 
                        className="w-full"
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        // Default file preview
        return (
            <div 
                className="flex items-center justify-center p-4 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-4v1h4v5h-1v-1h-2v1h-1v-5h4v-1zm-2-4V3.5L17.5 9H11z" />
                </svg>
                <span className="ml-2 font-medium">{fileName}</span>
            </div>
        );
    };

    return (
        <>
            <div className={cn("", className)}>
                {renderPreview()}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-xl">{fileName}</DialogTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" asChild>
                                <a href={url} download={fileName}>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto p-6">
                        {isImage && (
                            <div className="relative w-full h-full">
                                <Image
                                    src={url}
                                    alt={fileName}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                                />
                            </div>
                        )}
                        {isPDF && (
                            <iframe
                                src={`${url}#toolbar=0`}
                                className="w-full h-full rounded-md"
                                title={fileName}
                            />
                        )}
                        {isAudio && (
                            <div className="flex items-center justify-center h-full">
                                <audio 
                                    controls 
                                    src={url} 
                                    className="w-full"
                                >
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                        {!isImage && !isPDF && !isAudio && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <svg className="w-16 h-16 text-muted-foreground mb-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-4v1h4v5h-1v-1h-2v1h-1v-5h4v-1zm-2-4V3.5L17.5 9H11z" />
                                </svg>
                                <p className="text-center text-muted-foreground">
                                    This file type cannot be previewed directly.
                                    <br />
                                    <a 
                                        href={url} 
                                        download={fileName}
                                        className="text-primary hover:underline mt-2 inline-block"
                                    >
                                        Download the file
                                    </a>
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 