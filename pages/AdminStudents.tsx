import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Profile, Class, Semester } from "../types";
import {
  Search,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Save,
  Plus,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

interface StudentFormData {
  email: string;
  full_name: string;
  nim: string;
  role: "STUDENT" | "ADMIN";
  class_id: string;
  semester_id: string;
  password?: string;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStudent, setUpdatingStudent] = useState<string | null>(null);
  const [studentUpdates, setStudentUpdates] = useState<
    Record<string, { class_id: string | null; semester_id: string | null }>
  >({});

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    email: "",
    full_name: "",
    nim: "",
    role: "STUDENT",
    class_id: "",
    semester_id: "",
    password: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: stdData } = await supabase
      .from("profiles")
      .select("*, class:classes(name), semester:semesters(name)")
      .eq("role", "STUDENT")
      .order("full_name");

    const { data: clsData } = await supabase.from("classes").select("*");
    const { data: semData } = await supabase.from("semesters").select("*");

    if (stdData) setStudents(stdData);
    if (clsData) setClasses(clsData);
    if (semData) setSemesters(semData);
    setLoading(false);
  };

  useEffect(() => {
    const initialUpdates: Record<
      string,
      { class_id: string | null; semester_id: string | null }
    > = {};
    students.forEach((student) => {
      initialUpdates[student.id] = {
        class_id: student.class_id || null,
        semester_id: student.semester_id || null,
      };
    });
    setStudentUpdates(initialUpdates);
  }, [students]);

  const handleClassChange = (studentId: string, classId: string) => {
    setStudentUpdates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        class_id: classId || null,
      },
    }));
  };

  const handleSemesterChange = (studentId: string, semesterId: string) => {
    setStudentUpdates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        semester_id: semesterId || null,
      },
    }));
  };

  const updateStudent = async (studentId: string) => {
    setUpdatingStudent(studentId);

    const updates = studentUpdates[studentId];
    if (!updates) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        class_id: updates.class_id,
        semester_id: updates.semester_id,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Error updating student:", error);
      alert(`Gagal memperbarui data mahasiswa: ${error.message}`);
    } else {
      setStudents((prev) =>
        prev.map((std) =>
          std.id === studentId
            ? {
                ...std,
                class_id: updates.class_id,
                semester_id: updates.semester_id,
              }
            : std,
        ),
      );
    }

    setUpdatingStudent(null);
  };

  // Add new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password || "defaultPassword123",
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            nim: formData.nim,
            role: formData.role,
            class_id: formData.class_id || null,
            semester_id: formData.semester_id || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        alert("Mahasiswa berhasil ditambahkan!");
        setShowAddModal(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      console.error("Error adding student:", error);
      alert(`Gagal menambahkan mahasiswa: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit student
  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setFormLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          nim: formData.nim,
          role: formData.role,
          class_id: formData.class_id || null,
          semester_id: formData.semester_id || null,
        })
        .eq("id", selectedStudent.id);

      if (error) throw error;

      alert("Data mahasiswa berhasil diperbarui!");
      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating student:", error);
      alert(`Gagal memperbarui mahasiswa: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setFormLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", selectedStudent.id);

      if (error) throw error;

      alert("Mahasiswa berhasil dihapus!");
      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      alert(`Gagal menghapus mahasiswa: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (student: Profile) => {
    setSelectedStudent(student);
    setFormData({
      email: student.email,
      full_name: student.full_name,
      nim: student.nim || "",
      role: student.role as "STUDENT" | "ADMIN",
      class_id: student.class_id || "",
      semester_id: student.semester_id || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student: Profile) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      nim: "",
      role: "STUDENT",
      class_id: "",
      semester_id: "",
      password: "",
    });
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.nim &&
        student.nim.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Poppins']">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Manajemen Mahasiswa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar mahasiswa terdaftar dan pengaturan kelas serta semester
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          Tambah Mahasiswa
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari mahasiswa berdasarkan nama, email, atau NIM..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Mahasiswa
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Kelas
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Semester Aktif
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => (
                <tr
                  key={std.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
                        <User size={18} strokeWidth={2} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm block">
                          {std.full_name}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          {std.nim || "NIM tidak tersedia"}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {std.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-slate-400" size={16} />
                      <select
                        className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 min-w-[120px] font-medium"
                        value={
                          studentUpdates[std.id]?.class_id || std.class_id || ""
                        }
                        onChange={(e) =>
                          handleClassChange(std.id, e.target.value)
                        }
                      >
                        <option value="">Pilih Kelas...</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-slate-400" size={16} />
                      <select
                        className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 min-w-[120px] font-medium"
                        value={
                          studentUpdates[std.id]?.semester_id ||
                          std.semester_id ||
                          ""
                        }
                        onChange={(e) =>
                          handleSemesterChange(std.id, e.target.value)
                        }
                      >
                        <option value="">Pilih Semester...</option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStudent(std.id)}
                        disabled={updatingStudent === std.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                          updatingStudent === std.id
                            ? "bg-slate-200 text-slate-500"
                            : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                        }`}
                      >
                        {updatingStudent === std.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save size={14} strokeWidth={2.5} />
                            Simpan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(std)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm"
                      >
                        <Edit2 size={14} strokeWidth={2.5} />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(std)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    {searchTerm
                      ? "Tidak ada mahasiswa yang cocok dengan pencarian."
                      : "Belum ada mahasiswa terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <GraduationCap
                className="text-teal-600"
                size={24}
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Total Mahasiswa
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {students.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <BookOpen className="text-cyan-600" size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Jumlah Kelas
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {classes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar
                className="text-emerald-600"
                size={24}
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                Jumlah Semester
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {semesters.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                Tambah Mahasiswa Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="contoh@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Nama lengkap mahasiswa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  NIM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nim}
                  onChange={(e) =>
                    setFormData({ ...formData, nim: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Nomor Induk Mahasiswa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "STUDENT" | "ADMIN",
                    })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kelas
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Semester
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">Pilih Semester...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 transition-all shadow-lg"
                  disabled={formLoading}
                >
                  {formLoading ? "Menyimpan..." : "Tambah Mahasiswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                Edit Data Mahasiswa
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditStudent} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Email tidak dapat diubah
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  NIM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nim}
                  onChange={(e) =>
                    setFormData({ ...formData, nim: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "STUDENT" | "ADMIN",
                    })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kelas
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Semester
                </label>
                <select
                  value={formData.semester_id}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">Pilih Semester...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg"
                  disabled={formLoading}
                >
                  {formLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                Konfirmasi Hapus
              </h2>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Apakah Anda yakin ingin menghapus mahasiswa{" "}
                <strong>{selectedStudent.full_name}</strong>?
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                ⚠️ Tindakan ini tidak dapat dibatalkan. Semua data terkait
                mahasiswa ini akan dihapus secara permanen.
              </p>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                disabled={formLoading}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg"
                disabled={formLoading}
              >
                {formLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
