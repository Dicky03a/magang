import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Profile } from "../types";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

const Layout: React.FC<LayoutProps> = ({ children, profile }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const adminLinks = [
    { name: "Ringkasan", path: "/admin", icon: LayoutDashboard },
    { name: "Data Master", path: "/admin/data", icon: Settings },
    { name: "Tugas & Kuis", path: "/admin/assignments", icon: FileText },
    { name: "Laporan Nilai", path: "/admin/reports", icon: BarChart3 },
    { name: "Mahasiswa", path: "/admin/students", icon: Users },
  ];

  const studentLinks = [
    { name: "Dashboard", path: "/student", icon: LayoutDashboard },
  ];

  const links = profile.role === "ADMIN" ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-2">
          <GraduationCap size={24} />
          <span className="font-bold tracking-tight">EduTask</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-72 bg-white border-r border-slate-200 z-40 flex flex-col shadow-xl md:shadow-none
      `}
      >
        <div className="hidden md:flex p-8 border-b border-slate-50 items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={28} />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900 italic">
            EduTask.
          </span>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 p-3.5 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold translate-x-1"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {profile.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {profile.full_name}
              </p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                {profile.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-10 lg:p-12">
        {children}
      </main>
    </div>
  );
};

export default Layout;
