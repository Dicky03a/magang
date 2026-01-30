import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Assignment, TaskCategory, Course, Semester, Class } from "../types";
import {
  Plus,
  Search,
  FileText,
  ChevronRight,
  Filter,
  Eye,
  Trash2,
  X,
} from "lucide-react";

const AdminAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    course_id: "",
    semester_id: "",
    class_id: "",
    deadline: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [
      { data: assignData },
      { data: catData },
      { data: courseData },
      { data: semData },
      { data: classData },
    ] = await Promise.all([
      supabase
        .from("assignments")
        .select(
          "*, category:task_categories(name), course:courses(name), class:classes(name)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("task_categories").select("*"),
      supabase.from("courses").select("*"),
      supabase.from("semesters").select("*"),
      supabase.from("classes").select("*"),
    ]);

    if (assignData) setAssignments(assignData);
    if (catData) setCategories(catData);
    if (courseData) setCourses(courseData);
    if (semData) setSemesters(semData);
    if (classData) setClasses(classData);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .insert([formData])
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setShowModal(false);
      navigate(`/admin/assignments/${data.id}`);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus tugas ini beserta seluruh soalnya?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchInitialData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Poppins']">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tugas & Kuis</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola semua penugasan akademik di sini
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-teal-200 hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Tugas Baru
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari tugas berdasarkan judul..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition-all"
            />
          </div>
          <button className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all">
            <Filter size={20} />
          </button>
        </div>

        {/* Assignments List */}
        <div className="divide-y divide-slate-100">
          {assignments.map((assign) => (
            <div
              key={assign.id}
              className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">
                    {assign.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {assign.course?.name} • {assign.class?.name} •{" "}
                    {assign.category?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-semibold text-slate-700">
                    Deadline
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(assign.deadline).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wide ${
                    assign.is_published
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {assign.is_published ? "Published" : "Draft"}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/admin/assignments/${assign.id}`)}
                    className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                  >
                    <Eye size={18} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDelete(assign.id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {assignments.length === 0 && !loading && (
            <div className="p-16 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                Belum ada tugas yang dibuat
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Klik tombol "Tugas Baru" untuk membuat
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                Buat Tugas Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium transition-all"
                  placeholder="Kuis Pertemuan 1..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Kategori
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">Pilih...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mata Kuliah
                  </label>
                  <select
                    required
                    value={formData.course_id}
                    onChange={(e) =>
                      setFormData({ ...formData, course_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">Pilih...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Semester
                  </label>
                  <select
                    required
                    value={formData.semester_id}
                    onChange={(e) =>
                      setFormData({ ...formData, semester_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">Pilih...</option>
                    {semesters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Kelas
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) =>
                      setFormData({ ...formData, class_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">Pilih...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Batas Waktu (Deadline)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
              >
                Buat Tugas & Tambah Soal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;
