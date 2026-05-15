import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-fg-muted">
        Rentomojo Clone · GitHub-themed Electron app · Built with React + Express + Prisma
      </footer>
    </div>
  );
}
