'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Task, Project } from '@/lib/types'

interface ProjectProgressProps {
  tasks: Task[]
  projects: Project[]
}

export function ProjectProgress({ tasks, projects }: ProjectProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.project_id === project.id.toString())
            const completedTasks = projectTasks.filter(t => t.status === 'Complete')
            const progress = projectTasks.length > 0 
              ? (completedTasks.length / projectTasks.length) * 100 
              : 0

            return (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {completedTasks.length}/{projectTasks.length} tasks
                  </span>
                </div>
                <Progress value={progress} />
              </div>
            )
          })}
          {projects.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No projects yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 