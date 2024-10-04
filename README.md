# Ultimate Todo App

## Overview

The Ultimate Todo App is a comprehensive task management solution built with Next.js, React, and Supabase. It offers a rich set of features to help users organize, track, and complete their tasks efficiently.

## Features

- **Task Management**: Create, edit, delete, and organize tasks
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Project Organization**: Group tasks by projects
- **AI-Powered Task Generation**: Use AI to generate subtasks and get task suggestions
- **Pomodoro Timer**: Built-in timer for focused work sessions
- **Analytics**: Visualize task completion and productivity trends
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Supabase (PostgreSQL database)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built with Radix UI primitives
- **Drag and Drop**: @hello-pangea/dnd
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Key Components

### UltimateTodoAppComponent

The main component that orchestrates the entire application. It manages global state and contains key functionalities such as task management, project handling, and AI integrations.

### Tasks Component

Renders the list of tasks and provides filtering and search capabilities. It also handles drag-and-drop functionality for task reordering.

### TaskItem Component

Represents individual task items with subtask management, status toggling, and timer functionality.

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase and configure environment variables
4. Run the development server: `npm run dev`

## API Routes

The application uses Hono for API routing. Key routes include:

- `/api/parse`: For parsing task input
- `/api/taskBreakdown`: For AI-powered task breakdown
- `/api/aiSuggestion`: For generating AI suggestions

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them
4. Push to your fork and submit a pull request

## License

[MIT License](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Hono](https://hono.dev/)