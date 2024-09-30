import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { BrainIcon, MoreVerticalIcon } from 'lucide-react';

interface DashboardProps {
    chartData: { name: string; value: number }[];
    aiSuggestion: string;
    getAISuggestions: () => void;
    applyAISuggestion: () => void;
}

export default function Dashboard({ chartData, aiSuggestion, getAISuggestions, applyAISuggestion }: DashboardProps) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Task Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            {aiSuggestion || 'Click the button to get an AI suggestion.'}
                        </p>
                        <div className="flex space-x-2">
                            <Button onClick={getAISuggestions}>
                                <BrainIcon className="h-4 w-4 mr-2" /> Get Suggestion
                            </Button>
                            {aiSuggestion && (
                                <Button onClick={applyAISuggestion}>
                                    Apply Suggestion
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">To Do</CardTitle>
                        <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.find(data => data.name === 'To Do')?.value}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.find(data => data.name === 'In Progress')?.value}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Review</CardTitle>
                        <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.find(data => data.name === 'In Review')?.value}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.find(data => data.name === 'Complete')?.value}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
