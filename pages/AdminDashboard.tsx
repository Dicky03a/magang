import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Assignment, Profile } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    activeDeadlines: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch Counts
    const { count: assignCount } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true });
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "STUDENT");
    const { count: subCount } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true });

    const now = new Date().toISOString();
    const { count: activeCount } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .gt("deadline", now);

    setStats({
      totalAssignments: assignCount || 0,
      totalStudents: studentCount || 0,
      totalSubmissions: subCount || 0,
      activeDeadlines: activeCount || 0,
    });

    // Fetch Recent Assignments
    const { data: recent } = await supabase
      .from("assignments")
      .select("*, course:courses(name), category:task_categories(name)")
      .order("created_at", { ascending: false })
      .limit(4);

    if (recent) setRecentAssignments(recent as unknown as Assignment[]);

    // Fetch Average Score Per Course for Chart
    const { data: scores } = await supabase.from("submissions").select(`
        score,
        assignment:assignments(course:courses(name))
      `);

    if (scores) {
      const courseAvg: Record<string, { total: number; count: number }> = {};
      scores.forEach((s: any) => {
        const name = s.assignment.course.name;
        if (!courseAvg[name]) courseAvg[name] = { total: 0, count: 0 };
        courseAvg[name].total += s.score;
        courseAvg[name].count += 1;
      });

      const data = Object.keys(courseAvg).map((key) => ({
        name: key.length > 10 ? key.substring(0, 10) + "..." : key,
        score: Math.round(courseAvg[key].total / courseAvg[key].count),
      }));
      setChartData(data.length > 0 ? data : [{ name: "MK Contoh", score: 0 }]);
    }

    setLoading(false);
  };

  const statCards = [
    {
      label: "Total Tugas",
      value: stats.totalAssignments,
      icon: FileText,
      color: "teal",
      bgGradient: "from-teal-600 to-teal-700",
      lightBg: "bg-teal-50",
      textColor: "text-teal-700",
    },
    {
      label: "Mahasiswa",
      value: stats.totalStudents,
      icon: Users,
      color: "cyan",
      bgGradient: "from-cyan-600 to-cyan-700",
      lightBg: "bg-cyan-50",
      textColor: "text-cyan-700",
    },
    {
      label: "Pengerjaan",
      value: stats.totalSubmissions,
      icon: CheckCircle,
      color: "emerald",
      bgGradient: "from-emerald-600 to-emerald-700",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Tugas Aktif",
      value: stats.activeDeadlines,
      icon: Clock,
      color: "amber",
      bgGradient: "from-amber-500 to-amber-600",
      lightBg: "bg-amber-50",
      textColor: "text-amber-700",
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Sparkles className="text-teal-600 animate-pulse" size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">
            Menyiapkan Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Poppins']">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Selamat datang kembali, pantau aktivitas sistem Anda
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/assignments")}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-teal-200 hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Buat Tugas Baru
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.lightBg} p-3 rounded-xl`}>
                  <Icon size={24} className={card.textColor} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1">
                {card.value}
              </h3>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Rata-rata Nilai per Mata Kuliah
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Performa akademik mahasiswa
              </p>
            </div>
            <div className="px-4 py-2 bg-slate-100 rounded-xl">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Tahun 2024
              </span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500, fill: "#64748b" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Tugas Terbaru
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Aktivitas terkini</p>
            </div>
            <div className="bg-teal-50 p-2 rounded-xl">
              <FileText size={20} className="text-teal-600" strokeWidth={2} />
            </div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
            {recentAssignments.map((assign, index) => (
              <div
                key={assign.id}
                onClick={() => navigate(`/admin/assignments/${assign.id}`)}
                className="group cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                      {assign.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {assign.course?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wide">
                        {assign.category?.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all mt-1"
                  />
                </div>
              </div>
            ))}
            {recentAssignments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <div className="bg-slate-100 p-4 rounded-2xl mb-3">
                  <Award size={32} className="text-slate-400" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Belum ada tugas
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Buat tugas pertama Anda
                </p>
              </div>
            )}
          </div>
          {recentAssignments.length > 0 && (
            <button
              onClick={() => navigate("/admin/assignments")}
              className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-semibold text-slate-700 transition-all"
            >
              Lihat Semua Tugas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
