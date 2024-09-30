'use client';

import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcherButton } from './ui/themeswitcher';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  theme: string;
  setTheme: (value: string) => void;
}

export default function Header({  }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Ultima - #1 ToDo application</h1>
      <div className="flex items-center space-x-2">
        <ThemeSwitcherButton />
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5" />
        </Button>
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
          <AvatarImage src="https://github.com/shadcn.png" />
        </Avatar>
      </div>
    </div>
  );
}
