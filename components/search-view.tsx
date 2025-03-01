"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, Tag, Calendar } from "lucide-react"
import { Task } from "@/lib/types"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useSupabase } from "@/lib/hooks/useSupabase"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"

export function SearchView() {
  const [query, setQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [isLoading, setIsLoading] = React.useState(false)
  const [results, setResults] = React.useState<{
    tasks: Task[],
    projects: any[],
    tags: string[],
  }>({
    tasks: [],
    projects: [],
    tags: [],
  })
  
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const supabase = useSupabase()

  React.useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery) {
        setResults({ tasks: [], projects: [], tags: [] })
        return
      }

      setIsLoading(true)
      try {
        // Search tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
          .limit(10)

        // Search projects
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .or(`name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
          .limit(10)

        // Search tags
        const { data: tags } = await supabase
          .from('tags')
          .select('name')
          .ilike('name', `%${debouncedQuery}%`)
          .limit(10)

        setResults({
          tasks: tasks || [],
          projects: projects || [],
          tags: tags?.map(t => t.name) || [],
        })
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, supabase])

  const filteredResults = React.useMemo(() => {
    if (activeTab === "all") return results
    return {
      tasks: activeTab === "tasks" ? results.tasks : [],
      projects: activeTab === "projects" ? results.projects : [],
      tags: activeTab === "tags" ? results.tags : [],
    }
  }, [results, activeTab])

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, projects, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tasks</h3>
                  {filteredResults.tasks.map((task) => (
                    <Card key={task.id} className="mb-2 cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/tasks/${task.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                              </span>
                              {task.category && (
                                <Badge variant="secondary">{task.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredResults.projects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Projects</h3>
                  {filteredResults.projects.map((project) => (
                    <Card key={project.id} className="mb-2 cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/projects/${project.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredResults.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredResults.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => router.push(`/tasks?tag=${tag}`)}>
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {query && !isLoading && 
                !filteredResults.tasks.length && 
                !filteredResults.projects.length && 
                !filteredResults.tags.length && (
                <div className="text-center text-muted-foreground py-8">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Tabs>
    </div>
  )
} 