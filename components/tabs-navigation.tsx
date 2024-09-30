import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboardIcon, ListTodoIcon, FolderIcon, BarChartIcon } from 'lucide-react';

interface TabsNavigationProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export default function TabsNavigation({ activeTab, onValueChange, children }: TabsNavigationProps) {
  return (
    <Tabs value={activeTab} onValueChange={onValueChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="dashboard">
          <LayoutDashboardIcon className="h-4 w-4 mr-2" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="tasks">
          <ListTodoIcon className="h-4 w-4 mr-2" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="projects">
          <FolderIcon className="h-4 w-4 mr-2" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <BarChartIcon className="h-4 w-4 mr-2" />
          Analytics
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
