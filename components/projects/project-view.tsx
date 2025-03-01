import { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

type ProjectWithTasks = Project & {
  tasks: Task[]
}

interface ProjectViewProps {
  project: ProjectWithTasks
}

export function ProjectView({ project }: ProjectViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Total Tasks</h3>
          <p className="text-3xl font-bold">{project.tasks?.length || 0}</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Completed Tasks</h3>
          <p className="text-3xl font-bold">
            {project.tasks?.filter(t => t.status === 'Complete').length || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">In Progress</h3>
          <p className="text-3xl font-bold">
            {project.tasks?.filter(t => t.status === 'In Progress').length || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Due Soon</h3>
          <p className="text-3xl font-bold">
            {project.tasks?.filter(t => {
              const dueDate = new Date(t.due_date)
              const now = new Date()
              const diff = dueDate.getTime() - now.getTime()
              const days = diff / (1000 * 3600 * 24)
              return days <= 7 && days > 0
            }).length || 0}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Project Tasks</h3>
          <div className="mt-4 space-y-4">
            {project.tasks && project.tasks.length > 0 ? (
              project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'Complete' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : task.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                    }`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.priority === 'High'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No tasks in this project yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 