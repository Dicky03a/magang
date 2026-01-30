import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Assignment, Submission, Profile } from "../types";
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  History,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";

interface StudentDashboardProps {
  profile: Profile;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">(
    "pending",
  );
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: assignments } = await supabase
      .from("assignments")
      .select("*, course:courses(name), category:task_categories(name)")
      .eq("class_id", profile.class_id)
      .eq("semester_id", profile.semester_id)
      .eq("is_published", true)
      .order("deadline", { ascending: true });

    const { data: subs } = await supabase
      .from("submissions")
      .select("*, assignment:assignments(title, course:courses(name))")
      .eq("student_id", profile.id)
      .order("submitted_at", { ascending: false });

    if (assignments) setActiveAssignments(assignments);
    if (subs) setSubmissions(subs);
    setLoading(false);
  };

  const isCompleted = (assignmentId: string) => {
    return submissions.some((s) => s.assignment_id === assignmentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  const pendingAssignments = activeAssignments.filter(
    (a) => !isCompleted(a.id),
  );
  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((acc, s) => acc + (s.score || 0), 0) /
            submissions.length,
        )
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Welcome Section */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden shadow-xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Welcome Text */}
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
                Halo, {profile.full_name}! 👋
              </h1>
              <p className="text-teal-50 text-sm sm:text-base lg:text-lg leading-relaxed">
                Fokus pada tugasmu hari ini. Kamu memiliki{" "}
                <span className="font-bold text-white underline decoration-2 underline-offset-2">
                  {pendingAssignments.length} tugas
                </span>{" "}
                yang belum dikerjakan di kelas{" "}
                {(profile as any).class?.name || "-"}.
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:min-w-[200px] shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-teal-500/30 rounded-xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-teal-100" />
                </div>
                <div>
                  <span className="block text-[10px] sm:text-xs font-semibold text-teal-100 uppercase tracking-wider">
                    Rata-rata Nilai
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {avgScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("pending")}
                className={`
                  flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-all relative
                  ${
                    activeTab === "pending"
                      ? "text-teal-700 bg-teal-50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Tugas Aktif</span>
                  <span
                    className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${
                      activeTab === "pending"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }
                  `}
                  >
                    {pendingAssignments.length}
                  </span>
                </div>
                {activeTab === "pending" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("completed")}
                className={`
                  flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-all relative
                  ${
                    activeTab === "completed"
                      ? "text-teal-700 bg-teal-50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Riwayat Selesai</span>
                  <span className="sm:hidden">Selesai</span>
                  <span
                    className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${
                      activeTab === "completed"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }
                  `}
                  >
                    {submissions.length}
                  </span>
                </div>
                {activeTab === "completed" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Tasks Content */}
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-3 sm:space-y-4">
                {activeTab === "pending" ? (
                  pendingAssignments.length > 0 ? (
                    pendingAssignments.map((assign) => (
                      <div
                        key={assign.id}
                        className="group bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 lg:p-6">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold tracking-wide uppercase px-2 sm:px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                                  <BookOpen className="w-3 h-3" />
                                  {assign.category?.name}
                                </span>
                                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                                  {assign.course?.name}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                                {assign.title}
                              </h3>
                            </div>

                            {/* Deadline Badge */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 w-fit">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <div className="text-left">
                                <span className="block text-[10px] text-orange-600 font-semibold uppercase">
                                  Deadline
                                </span>
                                <span className="block text-xs sm:text-sm font-bold text-orange-700">
                                  {new Date(assign.deadline).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => navigate(`/assignment/${assign.id}`)}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-xl group"
                          >
                            <span>Kerjakan Sekarang</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={ClipboardList}
                      title="Tidak Ada Tugas Aktif"
                      description="Saat ini tidak ada tugas yang perlu dikerjakan."
                    />
                  )
                ) : submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-100 to-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-200">
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base lg:text-lg line-clamp-1">
                            {sub.assignment?.title}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500">
                            <span className="font-medium">
                              {sub.assignment?.course?.name}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              {new Date(sub.submitted_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                            Skor
                          </span>
                          <span className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-700">
                            {sub.score}
                          </span>
                        </div>
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={History}
                    title="Belum Ada Tugas Selesai"
                    description="Tugas yang sudah dikerjakan akan muncul di sini."
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-4 sm:space-y-6">
          {/* Academic Status Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Status Akademik
                </h3>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <InfoItem label="Program Studi" value="Teknik Informatika" />
              <InfoItem
                label="Kelas"
                value={(profile as any).class?.name || "-"}
              />
              <InfoItem
                label="Semester"
                value={(profile as any).semester?.name || "-"}
              />
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl sm:rounded-2xl border border-teal-200 p-4 sm:p-5 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Statistik Cepat
            </h3>

            <div className="space-y-3">
              <StatItem
                label="Total Tugas Selesai"
                value={submissions.length.toString()}
                color="green"
              />
              <StatItem
                label="Tugas Tertunda"
                value={pendingAssignments.length.toString()}
                color="orange"
              />
              <StatItem
                label="Rata-rata Nilai"
                value={avgScore.toString()}
                color="teal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="py-12 sm:py-16 lg:py-20 text-center space-y-4">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
      <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-lg font-bold text-slate-700">{title}</h3>
      <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto px-4">
        {description}
      </p>
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs sm:text-sm text-slate-600 font-medium">
      {label}
    </span>
    <span className="text-sm sm:text-base font-bold text-slate-900">
      {value}
    </span>
  </div>
);

const StatItem: React.FC<{
  label: string;
  value: string;
  color: "green" | "orange" | "teal";
}> = ({ label, value, color }) => {
  const colorClasses = {
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
      <span className="text-xs sm:text-sm text-slate-600 font-medium">
        {label}
      </span>
      <span
        className={`text-lg sm:text-xl font-black px-3 py-1 rounded-lg border ${colorClasses[color]}`}
      >
        {value}
      </span>
    </div>
  );
};

export default StudentDashboard;
