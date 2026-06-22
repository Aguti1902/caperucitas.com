import { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import AdminNav from './AdminNav';

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, subtitle, icon, actions, children }: AdminLayoutProps) {
  return (
    <div className="admin-layout min-h-screen bg-gray-950">
      <AdminHeader />
      <AdminNav />

      {/* Hero con H1 — visible en todas las pantallas admin */}
      <section className="admin-hero border-b border-[#fc4d5c]/20 bg-gradient-to-r from-gray-900 via-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                {icon}
                {title}
              </h1>
              {subtitle && <p className="text-gray-400 text-sm mt-2">{subtitle}</p>}
            </div>
            {actions}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">{children}</main>
    </div>
  );
}
