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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

const Layout: React.FC<LayoutProps> = ({ children, profile }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <div className="min-h-screen bg-slate-50 flex font-['Poppins']">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-700 p-2 rounded-xl">
            <GraduationCap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-800 text-lg">EduTask</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed md:sticky top-0 left-0 h-screen
        transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"} 
        bg-white border-r border-slate-200 z-40 flex flex-col
      `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-teal-700 p-2 rounded-xl">
                <GraduationCap
                  size={24}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>
              <span className="font-bold text-slate-800 text-xl">EduTask</span>
            </div>
          )}
          {isCollapsed && (
            <div className="bg-teal-700 p-2 rounded-xl mx-auto">
              <GraduationCap
                size={24}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1.5 hover:bg-slate-100 rounded-lg transition-all ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                title={isCollapsed ? link.name : ""}
                className={`
                  group flex items-center ${isCollapsed ? "justify-center" : "justify-start"} 
                  gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-teal-700 text-white shadow-lg shadow-teal-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                <Icon size={20} strokeWidth={2} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-[15px] whitespace-nowrap">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-100">
          {!isCollapsed ? (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 mb-3 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {profile.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {profile.full_name}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {profile.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
              >
                <LogOut size={16} strokeWidth={2} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                {profile.full_name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
