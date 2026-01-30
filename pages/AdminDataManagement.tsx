import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Semester, Course, Class } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  BookOpen,
  Calendar,
  Users,
} from "lucide-react";

const AdminDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "semesters" | "courses" | "classes"
  >("semesters");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCode, setNewItemCode] = useState(""); // Only for courses

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === "semesters") {
      const { data } = await supabase
        .from("semesters")
        .select("*")
        .order("name");
      if (data) setSemesters(data);
    } else if (activeTab === "courses") {
      const { data } = await supabase.from("courses").select("*").order("name");
      if (data) setCourses(data);
    } else {
      const { data } = await supabase.from("classes").select("*").order("name");
      if (data) setClasses(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newItemName) return;
    setLoading(true);

    let error;
    if (activeTab === "semesters") {
      ({ error } = await supabase
        .from("semesters")
        .insert({ name: newItemName }));
    } else if (activeTab === "courses") {
      ({ error } = await supabase
        .from("courses")
        .insert({ name: newItemName, code: newItemCode }));
    } else {
      ({ error } = await supabase
        .from("classes")
        .insert({ name: newItemName }));
    }

    if (error) alert(error.message);
    else {
      setNewItemName("");
      setNewItemCode("");
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus data ini?")) return;
    const { error } = await supabase.from(activeTab).delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Poppins']">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Manajemen Data Master
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data dasar akademik untuk sistem EduTask
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("semesters")}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "semesters"
              ? "bg-white text-teal-600 shadow-md"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Calendar size={18} strokeWidth={2} /> Semester
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "courses"
              ? "bg-white text-teal-600 shadow-md"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen size={18} strokeWidth={2} /> Mata Kuliah
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "classes"
              ? "bg-white text-teal-600 shadow-md"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={18} strokeWidth={2} /> Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Form Add */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-5">
            Tambah Data Baru
          </h3>
          <div className="space-y-4">
            {activeTab === "courses" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Kode MK
                </label>
                <input
                  type="text"
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium transition-all"
                  placeholder="Contoh: IF101"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Nama{" "}
                {activeTab === "semesters"
                  ? "Semester"
                  : activeTab === "courses"
                    ? "Mata Kuliah"
                    : "Kelas"}
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium transition-all"
                placeholder={`Nama ${activeTab}...`}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.5} /> Simpan Data
            </button>
          </div>
        </div>

        {/* List Data */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Nama
                </th>
                {activeTab === "courses" && (
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Kode
                  </th>
                )}
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === "semesters"
                ? semesters
                : activeTab === "courses"
                  ? courses
                  : classes
              ).map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-slate-800">
                    {item.name}
                  </td>
                  {activeTab === "courses" && (
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-500 font-medium">
                      {(item as Course).code}
                    </td>
                  )}
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td
                    colSpan={activeTab === "courses" ? 3 : 2}
                    className="px-4 py-8 sm:px-6 sm:py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium text-sm">
                        Memuat data...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                (activeTab === "semesters"
                  ? semesters
                  : activeTab === "courses"
                    ? courses
                    : classes
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === "courses" ? 3 : 2}
                      className="px-4 py-8 sm:px-6 sm:py-12 text-center text-slate-400 italic text-sm"
                    >
                      Belum ada data
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDataManagement;
