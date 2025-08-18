# Voiceflow Prompts Manager

A Next.js application for managing and versioning LLM prompts with local database storage and optional GitHub publishing.

## Features

- 🔐 **Flexible Authentication** - Google OAuth with configurable email domains or optional auth bypass
- 🗄️ **Local Database Storage** - Fast SQLite database for prompt management
- 📁 **GitHub Publishing** - Optionally publish prompts to GitHub repository
- 🤖 **LLM Model Support** - Pre-configured LLM models from major providers
- 📝 **Prompt Management** - Create, edit, delete, and organize prompts
- 🕰️ **Version History** - Local versioning system with revert functionality
- 📊 **Dashboard** - Summary view with statistics and recent activity
- 🎨 **Modern UI** - Built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Google Provider
- **GitHub Integration**: Octokit for publishing
- **Styling**: Tailwind CSS with custom design system

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **Google OAuth Application** configured for your domain
3. **Email address from authorized domains** for authentication (or disable auth entirely)
4. **GitHub Repository** (optional, for publishing prompts)
5. **GitHub Personal Access Token** (optional, for publishing to GitHub)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd voiceflow-prompts-manager
npm install
```

### 2. Database Setup

Initialize the database:

```bash
npm run db:push
```

This will create the SQLite database and set up the schema.

### 3. Environment Configuration

Copy the environment template:

```bash
cp env.example .env.local
```

Fill in the required environment variables in `.env.local`:

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Allowed email domains for authentication (comma-separated list)
# Example: ALLOWED_EMAIL_DOMAINS=voiceflow.com,example.com,company.com
ALLOWED_EMAIL_DOMAINS=voiceflow.com

# Authentication bypass (set to 'true' to disable Google auth requirement)
NEXT_PUBLIC_DISABLE_AUTH=false

# GitHub Configuration (optional, for publishing)
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-prompts-repository-name

# Environment
NODE_ENV=development
```

### 4. GitHub Setup (Optional)

If you want to publish prompts to GitHub:

1. Create a new repository for storing prompts
2. Generate a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a token with `repo` scope
   - Add the token to your `.env.local` file

### 5. Authentication Configuration

#### Option A: Google OAuth Setup (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Add the Client ID and Secret to your `.env.local` file
6. Configure allowed email domains in `ALLOWED_EMAIL_DOMAINS` (comma-separated list)

#### Option B: Disable Authentication (Development/Internal Use)

1. Set `NEXT_PUBLIC_DISABLE_AUTH=true` in your `.env.local` file
2. Google OAuth configuration becomes optional
3. Users can access the application without authentication
4. **Warning**: Only use this for development or secure internal networks

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js configuration
│   │   ├── prompts/       # Prompt management endpoints
│   │   └── models/        # LLM models endpoint (static data)
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard.tsx     # Main dashboard
│   ├── login-page.tsx    # Login interface
│   ├── prompt-list.tsx   # Prompts listing
│   ├── prompt-dialog.tsx # Create/edit prompt modal
│   └── version-dialog.tsx # Version history modal
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── github.ts        # GitHub API integration
│   ├── models.ts        # LLM models service (static data)
│   └── utils.ts         # Utility functions
├── data/                 # Static data files
│   └── llm-models.json  # Pre-configured LLM models from major providers
└── types/               # TypeScript type definitions
```

## How It Works

### Database-First Approach

All prompts are stored in a local SQLite database for fast access and reliable versioning. Each prompt has:

- **Core Data**: Name, description, category, model, content
- **Metadata**: Creation/update timestamps, publish status
- **Versioning**: Automatic version tracking for every edit

### Publishing to GitHub

When you're ready to share a prompt publicly:

1. Click the "Publish" button on any prompt
2. The prompt is committed to your GitHub repository
3. Updates to published prompts sync to GitHub automatically

### GitHub Storage Structure

Published prompts are stored in GitHub as:

```
prompts/
├── my-chat-prompt/
│   └── prompts.md       # Contains metadata and content
├── translation-prompt/
│   └── prompts.md
└── ...
```

### Authentication Flow

The application supports flexible authentication modes:

#### Google OAuth Mode (Default)
1. User visits the application
2. Redirected to Google OAuth if not authenticated
3. Google returns user info
4. Application checks if email domain is in the allowed domains list (configurable via `ALLOWED_EMAIL_DOMAINS`)
5. Access granted or denied based on email domain match

#### No Auth Mode (Development/Internal Use)
1. Set `NEXT_PUBLIC_DISABLE_AUTH=true` in your environment
2. Application bypasses all authentication checks
3. Users can access the application directly without login
4. Useful for development, testing, or internal-only deployments

### Local Versioning

- **Create**: New prompts automatically get version 1
- **Update**: Each edit creates a new version in the database
- **Delete**: Removes prompt and all versions
- **History**: View all versions with timestamps and metadata
- **Revert**: Restore any previous version as the current version

### GitHub Integration

- **Publish**: Send current prompt version to GitHub repository
- **Update**: Sync published prompt changes to GitHub
- **Optional**: GitHub is only used for sharing, not storage

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:migrate` - Create and run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio for database management

## Deployment

### Environment Variables for Production

Make sure to set all environment variables in your production environment:

- Update `NEXTAUTH_URL` to your production domain
- Use production Google OAuth credentials
- Ensure GitHub token has appropriate permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[MIT License](LICENSE)

## Support

For questions or issues, create an issue in the repository.
