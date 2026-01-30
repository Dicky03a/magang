
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
// Fixed: Added TrendingUp to the imports from lucide-react
import { Book, GraduationCap, ArrowRight, CheckCircle2, Shield, Zap, Layout as LayoutIcon, TrendingUp } from 'lucide-react';

const PublicHome: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: courseData } = await supabase.from('courses').select('*').limit(6);
      if (courseData) setCourses(courseData);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-blue-700">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <GraduationCap size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">EduTask.</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Fitur</a>
            <a href="#courses" className="hover:text-blue-600 transition-colors">Mata Kuliah</a>
            <Link 
              to="/login" 
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
            >
              Masuk Sistem <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Zap size={14} />
              <span>Sistem Akademik Modern v1.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Kelola Tugas Kuliah <span className="text-blue-600">Lebih Cerdas.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
              Platform ujian dan penugasan otomatis untuk mahasiswa Teknik Informatika. Penilaian instan, transparan, dan terorganisir.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/login" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 group">
                Mulai Gunakan <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="bg-white border-2 border-slate-100 text-slate-600 px-10 py-4 rounded-2xl font-black text-lg hover:border-slate-300 transition-all">
                Pelajari Fitur
              </button>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-blue-600/10 rounded-[3rem] blur-3xl -rotate-6"></div>
            <div className="relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-black">85</div>
                  <div>
                    <p className="font-black text-slate-900">Nilai Rata-rata</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Semester Ganjil</p>
                  </div>
                </div>
                {/* TrendingUp fixed by adding to imports */}
                <TrendingUp className="text-green-500" />
              </div>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-4 bg-slate-50 rounded-full w-full relative overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 bg-blue-600 rounded-full w-[${70 + (i*5)}%]`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Teknologi Pembelajaran Terintegrasi</h2>
            <p className="text-slate-500 font-medium text-lg">Didesain khusus untuk memenuhi kebutuhan program studi yang dinamis dan berfokus pada efisiensi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Zap size={28} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-slate-900">Real-time Feedback</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Nilai kuis pilihan ganda dihitung secara instan. Mahasiswa langsung tahu skor mereka setelah submit.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <LayoutIcon size={28} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-slate-900">Manajemen Kelas</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Admin dapat dengan mudah mengatur pembagian tugas berdasarkan kelas dan semester mahasiswa.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-slate-900">Data Terpusat</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Seluruh riwayat pengumpulan tersimpan aman dan dapat diekspor untuk keperluan akreditasi prodi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mata Kuliah Aktif</h2>
              <p className="text-slate-500 font-medium">Mata kuliah inti yang tersedia dalam sistem EduTask.</p>
            </div>
            <button className="text-blue-600 font-black flex items-center gap-2 hover:gap-3 transition-all underline decoration-2 underline-offset-8">
              Lihat Katalog Lengkap <ArrowRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="p-8 bg-white border-2 border-slate-50 rounded-3xl hover:border-blue-100 hover:shadow-lg transition-all group">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit mb-6">
                  {course.code}
                </div>
                <h4 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{course.name}</h4>
                <div className="mt-8 flex items-center text-slate-400 gap-2 text-sm font-bold">
                  <Book size={16} />
                  <span>Materi Terintegrasi</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <GraduationCap size={28} />
              </div>
              <span className="text-3xl font-black italic">EduTask.</span>
            </div>
            <p className="text-slate-400 font-medium max-w-xs">Smart solution for modern academic management.</p>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-sm font-bold text-slate-500">© 2024 Teknik Informatika University.</p>
            <p className="text-xs text-slate-600">Built with Precision & Dedication.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHome;
