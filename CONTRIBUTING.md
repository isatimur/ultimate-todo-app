# Contributing to Ultimate Todo App

Thank you for considering contributing to Ultimate Todo App! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue tracker to avoid duplicates. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Describe the behavior you observed and what you expected to see
- Include screenshots if possible
- Include your environment details (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- Include mockups or examples if applicable

### Pull Requests

- Fill in the required template
- Follow the TypeScript and React coding style
- Include tests when adding new features
- Update documentation as needed
- End all files with a newline
- Place imports in the following order:
  1. Built-in Node modules
  2. External modules (npm packages)
  3. Internal modules (using relative paths)

## Development Workflow

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ultimate-todo-app.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## Setting Up Development Environment

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file based on `.env.example`

3. Start the development server:
```bash
npm run dev
```

## Project Structure

- `app/`: Next.js app directory with routes and pages
- `components/`: React components
- `lib/`: Utility functions and types
- `hooks/`: Custom React hooks
- `supabase/`: Supabase configuration and types
- `public/`: Static assets
- `types/`: TypeScript type definitions

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid using `any` type
- Use functional components with hooks

### React

- Follow functional programming patterns
- Use React hooks appropriately
- Implement proper error handling
- Document components with JSDoc comments

### Styling

- Use Tailwind CSS for styling
- Follow the project's design system
- Ensure responsive design
- Maintain accessibility standards

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Follow the existing testing patterns

## Documentation

- Update README.md with any necessary changes
- Document new features
- Update API documentation if applicable

## Questions?

If you have any questions, feel free to create an issue or reach out to the maintainers.

Thank you for contributing to Ultimate Todo App! 