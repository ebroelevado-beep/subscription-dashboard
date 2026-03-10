# Professional Dashboard

A high-performance, modern dashboard built with **Next.js 16**, **Prisma**, and **AI integration**. This project provides a comprehensive solution for managing subscriptions, analytics, and client interactions with a premium user experience.

## ✨ Features

- **📊 Advanced Analytics**: Real-time data visualization and insights using Recharts.
- **🤖 AI Assistant Tab**: Integrated AI capabilities for intelligent support and automation.
- **💳 Subscription Management**: Full lifecycle management of user plans and seats.
- **🌐 Internationalization**: Multi-language support (ES, EN, ZH) powered by `next-intl`.
- **🔐 Secure Authentication**: Robust auth system via `next-auth`.
- **🛠️ Platform Integration**: Manage and switch between different workspace platforms easily.
- **🕘 Conversation History**: Persistent chat history stored securely in Cloudflare R2 with undo/redo support for AI actions.
- **🌑 Dark/Light Mode**: Beautifully crafted UI with responsive design and theme support.

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **AI Engine**: [Vercel AI SDK](https://sdk.vercel.ai/) (OpenAI Compatible)
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **i18n**: [Next-Intl](https://next-intl-docs.vercel.app/)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (Conversation History)

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 22.12.0
- bun (recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ebroelevado-beep/subscription-dashboard.git
   cd subscription-dashboard
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:
   Copy `.env` to `.env.local` and fill in the required values (Database URL, Auth secrets, AI API keys).

4. Initialize the database:
   ```bash
   bun x prisma generate
   bun x prisma migrate dev
   ```

### Development

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `bun dev`: Starts the development server.
- `bun build`: Builds the application for production.
- `bun start`: Starts the production server.
- `bun lint`: Runs ESLint for code quality checks.
- `bun postinstall`: Automatically generates Prisma client.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by [ebroelevado-beep](https://github.com/ebroelevado-beep)
