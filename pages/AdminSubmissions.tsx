import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Submission } from "../types";
import { convertScoreToGrade, getGradeColorClass } from "../lib/grading";
import {
  Search,
  Filter,
  Download,
  User,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronDown,
  X,
  FileText,
  Calendar,
  Award,
} from "lucide-react";

interface FilterOptions {
  course: string;
  class: string;
  minScore: number;
  maxScore: number;
  dateFrom: string;
  dateTo: string;
}

const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "score" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterOptions>({
    course: "",
    class: "",
    minScore: 0,
    maxScore: 100,
    dateFrom: "",
    dateTo: "",
  });

  const [courses, setCourses] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    const uniqueCourses = [
      ...new Set(
        submissions
          .map((sub) => sub.assignment?.course?.name)
          .filter(Boolean) as string[],
      ),
    ];
    const uniqueClasses = [
      ...new Set(
        submissions
          .map((sub) => (sub.student as any)?.class?.name)
          .filter(Boolean) as string[],
      ),
    ];

    setCourses(uniqueCourses);
    setClasses(uniqueClasses);
  }, [submissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          `
          *,
          student:profiles!submissions_student_id_fkey(
            id,
            full_name,
            email,
            class:classes(name)
          ),
          assignment:assignments!submissions_assignment_id_fkey(
            id,
            title,
            course:courses(name)
          )
        `,
        )
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setSubmissions(data as unknown as Submission[]);
      }
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredAndSortedSubmissions.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Nama Mahasiswa",
      "Email",
      "Kelas",
      "Tugas",
      "Mata Kuliah",
      "Waktu Pengumpulan",
      "Skor (%)",
      "Nilai Huruf",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAndSortedSubmissions.map((sub) =>
        [
          `"${sub.student?.full_name || ""}"`,
          `"${sub.student?.email || ""}"`,
          `"${(sub.student as any)?.class?.name || "Tanpa Kelas"}"`,
          `"${sub.assignment?.title || ""}"`,
          `"${sub.assignment?.course?.name || ""}"`,
          `"${new Date(sub.submitted_at).toLocaleString("id-ID")}"`,
          sub.score,
          convertScoreToGrade(sub.score),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `submissions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilters({
      course: "",
      class: "",
      minScore: 0,
      maxScore: 100,
      dateFrom: "",
      dateTo: "",
    });
    setSearchTerm("");
  };

  const filteredAndSortedSubmissions = submissions
    .filter((sub) => {
      const matchesSearch =
        sub.student?.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        sub.assignment?.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        sub.assignment?.course?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCourse =
        !filters.course || sub.assignment?.course?.name === filters.course;
      const matchesClass =
        !filters.class || (sub.student as any)?.class?.name === filters.class;
      const matchesScore =
        sub.score >= filters.minScore && sub.score <= filters.maxScore;

      const submittedDate = new Date(sub.submitted_at);
      const matchesDateFrom =
        !filters.dateFrom ||
        submittedDate >= new Date(filters.dateFrom + "T00:00:00");
      const matchesDateTo =
        !filters.dateTo ||
        submittedDate <= new Date(filters.dateTo + "T23:59:59");

      return (
        matchesSearch &&
        matchesCourse &&
        matchesClass &&
        matchesScore &&
        matchesDateFrom &&
        matchesDateTo
      );
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime();
          break;
        case "score":
          comparison = a.score - b.score;
          break;
        case "name":
          comparison = (a.student?.full_name || "").localeCompare(
            b.student?.full_name || "",
          );
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const calculateStats = () => {
    if (filteredAndSortedSubmissions.length === 0)
      return { avg: 0, highest: 0, lowest: 0, total: 0 };

    const scores = filteredAndSortedSubmissions.map((sub) => sub.score);
    return {
      avg: Math.round(
        scores.reduce((acc, score) => acc + score, 0) / scores.length,
      ),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      total: filteredAndSortedSubmissions.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Poppins']">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan & Nilai</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Pantau hasil pengerjaan tugas seluruh mahasiswa secara real-time
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download size={18} strokeWidth={2} /> Ekspor CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Pengumpulan
            </span>
            <div className="bg-teal-100 p-2 rounded-xl">
              <FileText size={20} className="text-teal-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Rata-Rata
            </span>
            <div className="bg-amber-100 p-2 rounded-xl">
              <Award size={20} className="text-amber-600" strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.avg}%</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tertinggi
            </span>
            <div className="bg-emerald-100 p-2 rounded-xl">
              <TrendingUp
                size={20}
                className="text-emerald-600"
                strokeWidth={2}
              />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.highest}%</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Terendah
            </span>
            <div className="bg-red-100 p-2 rounded-xl">
              <TrendingUp
                size={20}
                className="text-red-600 transform rotate-180"
                strokeWidth={2}
              />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.lowest}%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari nama mahasiswa, tugas, atau mata kuliah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border rounded-xl transition-all ${
                showFilters
                  ? "bg-teal-50 border-teal-500 text-teal-600"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Filter size={20} />
            </button>

            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy as "date" | "score" | "name");
                  setSortOrder(newSortOrder as "asc" | "desc");
                }}
                className="appearance-none px-4 py-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 font-medium text-sm cursor-pointer hover:bg-slate-100 transition-all"
              >
                <option value="date-desc">Terbaru</option>
                <option value="date-asc">Terlama</option>
                <option value="score-desc">Nilai Tertinggi</option>
                <option value="score-asc">Nilai Terendah</option>
                <option value="name-asc">Nama A-Z</option>
                <option value="name-desc">Nama Z-A</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                size={16}
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 p-5 bg-slate-50 rounded-2xl space-y-4 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Mata Kuliah
                  </label>
                  <select
                    value={filters.course}
                    onChange={(e) =>
                      setFilters({ ...filters, course: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                  >
                    <option value="">Semua Mata Kuliah</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Kelas
                  </label>
                  <select
                    value={filters.class}
                    onChange={(e) =>
                      setFilters({ ...filters, class: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Rentang Nilai
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.minScore}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minScore: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                      placeholder="Min"
                    />
                    <span className="text-slate-400 font-semibold">-</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.maxScore}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          maxScore: parseInt(e.target.value) || 100,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X size={16} /> Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Memuat data...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Mahasiswa
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Tugas / Mata Kuliah
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Waktu Kumpul
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide text-center">
                    Skor (%)
                  </th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide text-center">
                    Nilai Huruf
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAndSortedSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 sm:px-6 sm:py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm">
                          {sub.student?.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {sub.student?.full_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(sub.student as any)?.class?.name || "Tanpa Kelas"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-5">
                      <p className="font-semibold text-slate-800 text-sm">
                        {sub.assignment?.title}
                      </p>
                      <p className="text-xs text-teal-600 font-semibold">
                        {sub.assignment?.course?.name}
                      </p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 sm:px-6 sm:py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Clock size={14} />
                        {new Date(sub.submitted_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-5 text-center">
                      <div
                        className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-sm sm:text-base ${
                          sub.score >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : sub.score >= 60
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sub.score}
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-5 text-center">
                      <div
                        className={`inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-sm sm:text-base ${getGradeColorClass(convertScoreToGrade(sub.score))}`}
                      >
                        {convertScoreToGrade(sub.score)}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedSubmissions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 sm:px-6 sm:py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="bg-slate-100 p-4 rounded-2xl">
                          <TrendingUp size={48} strokeWidth={1.5} />
                        </div>
                        <p className="italic font-medium text-sm sm:text-base">
                          Tidak ada pengumpulan yang ditemukan
                        </p>
                        {(searchTerm ||
                          filters.course ||
                          filters.class ||
                          filters.dateFrom ||
                          filters.dateTo) && (
                          <button
                            onClick={resetFilters}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-semibold text-sm"
                          >
                            Reset semua filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubmissions;
