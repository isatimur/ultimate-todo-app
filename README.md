# Ultima Todo App v2.2.0

A modern, feature-rich task management application built with Next.js 14, TypeScript, and Supabase.

## Features

- 📅 Interactive Timeline View
  - Drag-and-drop task scheduling
  - Resizable task durations
  - 30-minute precision time slots
  - Visual task organization

- ✨ Modern UX
  - Clean, minimal interface
  - Smooth animations and transitions
  - Responsive design with optimized layouts
  - Dark/Light mode support
  - Collapsible sidebar with persistent state

- 🎯 Task Management
  - Priority levels
  - Status tracking
  - Duration management
  - Quick task creation
  - AI-powered task suggestions
  - Keyboard shortcuts
  - Rich text descriptions
  - Subtasks and dependencies

- 🤖 AI Assistant (New!)
  - Agentic task creation
  - Natural language task parsing
  - Smart scheduling suggestions
  - Context-aware task organization
  - Automated priority assignment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **State Management**: React Hooks
- **DnD**: @hello-pangea/dnd
- **Date Handling**: date-fns
- **AI Features**: OpenAI API
- **Email**: Resend
- **Animations**: Framer Motion

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier works)
- (Optional) OpenAI API key for AI features
- (Optional) Resend API key for email notifications

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/ultima-todo-app.git
cd ultima-todo-app
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Get Supabase credentials from your project settings
- (Optional) Add OpenAI API key for AI features
- (Optional) Add Resend API key for emails

4. Set up the database
- Create a new Supabase project
- Run the migration scripts from `supabase/migrations/`
- Enable Row Level Security (RLS)
- Set up authentication providers

5. Start the development server
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see the app.

## Database Schema

The app uses the following main tables:
- `tasks`: Main tasks table
- `projects`: Project organization
- `task_dependencies`: Task relationships
- `profiles`: User profiles
- `user_settings`: User preferences and settings

See `supabase/migrations/` for complete schema details.

## Key Components

### Layout System
- Responsive layout with collapsible sidebar
- Optimized content positioning
- Consistent spacing and alignment
- Smooth transitions between views

### TimelineView
- Main timeline interface
- Handles task organization
- Drag-and-drop functionality
- 48 time slots (30-minute intervals)

### TaskForm
- Rich task creation interface
- AI-powered suggestions
- Template support
- Quick actions

### AI Assistant
- Natural language processing for task creation
- Context-aware task suggestions
- Automated scheduling based on workload
- Priority inference from task description

### Settings
- Comprehensive user preferences
- Theme customization
- Notification management
- Privacy controls
- Account management

## AI Agentic Approach

The app implements an agentic approach to task management:

1. **Task Creation Agent**
   - Parses natural language input
   - Extracts key task parameters (deadline, priority, etc.)
   - Suggests appropriate projects and tags

2. **Scheduling Agent**
   - Analyzes existing workload
   - Suggests optimal time slots
   - Prevents overcommitment

3. **Priority Agent**
   - Infers task importance
   - Balances urgent vs. important tasks
   - Adapts to user behavior patterns

4. **Reminder Agent**
   - Provides smart notifications
   - Adjusts timing based on task proximity
   - Considers user's working hours

## Offline & Notifications

- Service worker powered by Workbox caches assets for offline support.
- Push notifications use the Notifications API with subscriptions sent to `/api/subscribe`.
- Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to enable browser push messaging.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Security

- All API keys should be kept private
- Use environment variables for sensitive data
- Follow Supabase security best practices
- Enable RLS for all tables
- Regularly update dependencies

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an issue for bug reports
- Join our Discord community (coming soon)
- Check the [documentation](docs/) for guides

## Versioning

We use SemVer for versioning:
- Major (X.0.0): Breaking changes
- Minor (0.X.0): New features
- Patch (0.0.X): Bug fixes

Current version: 2.2.0
