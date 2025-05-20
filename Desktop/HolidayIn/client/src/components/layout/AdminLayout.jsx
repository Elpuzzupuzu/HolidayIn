import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav>
          <ul>
            <li><a href="/admin/dashboard" className="block py-2 px-3 hover:bg-gray-700 rounded">Dashboard</a></li>
            <li><a href="/admin/logs" className="block py-2 px-3 hover:bg-gray-700 rounded">Logs</a></li>
            <li><a href="/admin/settings" className="block py-2 px-3 hover:bg-gray-700 rounded">Settings</a></li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
