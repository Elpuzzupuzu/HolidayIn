// src/components/layout/AdminLayout.jsx

import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">Sidebar</aside>
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

