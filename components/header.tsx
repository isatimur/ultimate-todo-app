'use client';

import {motion} from 'framer-motion';

interface HeaderProps {
    toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div className="container flex h-16 items-center justify-between px-4">
                <button 
                    onClick={toggleSidebar} 
                    className="lg:hidden mr-4"
                >
                    <span className="sr-only">Toggle sidebar</span>
                    ☰
                </button>
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"
                >
                    Ultima
                </motion.h1>
            </div>
        </motion.header>
    );
}
