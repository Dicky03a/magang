import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  Save,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

type Option = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
};

type Question = {
  id: string;
  assignment_id: string;
  question_text: string;
  correct_option_id?: string | null;
  options: Option[];
};

type Assignment = {
  id: string;
  title: string;
  is_published: boolean;
  course?: { name: string };
};

const AdminAssignmentEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [localQuestionTexts, setLocalQuestionTexts] = useState<
    Record<string, string>
  >({});
  const [localOptionTexts, setLocalOptionTexts] = useState<
    Record<string, string>
  >({});

  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("id, title, is_published, course:courses(name)")
        .eq("id", id)
        .single();

      if (assignmentError) throw assignmentError;

      setAssignment(assignmentData);

      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("*")
        .eq("assignment_id", id)
        .order("created_at", { ascending: true });

      if (questionError) throw questionError;

      const questionIds = questionData.map((q) => q.id);

      if (questionIds.length > 0) {
        const { data: optionData, error: optionError } = await supabase
          .from("answer_options")
          .select("*")
          .in("question_id", questionIds);

        if (optionError) throw optionError;

        const merged = questionData.map((q) => ({
          ...q,
          options: optionData.filter((o) => o.question_id === q.id),
        }));

        setQuestions(merged);

        const initialQuestionTexts: Record<string, string> = {};
        const initialOptionTexts: Record<string, string> = {};

        merged.forEach((q) => {
          initialQuestionTexts[q.id] = q.question_text;
          q.options.forEach((opt) => {
            initialOptionTexts[opt.id] = opt.option_text;
          });
        });

        setLocalQuestionTexts(initialQuestionTexts);
        setLocalOptionTexts(initialOptionTexts);
      } else {
        setQuestions([]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!id) return;
    setAdding(true);

    try {
      const { data: question, error } = await supabase
        .from("questions")
        .insert({ assignment_id: id, question_text: "" })
        .select()
        .single();

      if (error) throw error;

      const optionLabels = ["", "", "", ""];
      const optionsToInsert = optionLabels.map((label) => ({
        question_id: question.id,
        option_text: ` ${label}`,
        is_correct: false,
      }));

      const { data: insertedOptions, error: optionError } = await supabase
        .from("answer_options")
        .insert(optionsToInsert)
        .select();

      if (optionError) throw optionError;

      setLocalQuestionTexts((prev) => ({
        ...prev,
        [question.id]: "Pertanyaan baru...",
      }));

      insertedOptions.forEach((opt) => {
        setLocalOptionTexts((prev) => ({
          ...prev,
          [opt.id]: opt.option_text,
        }));
      });

      await fetchAll();
    } catch (error: any) {
      console.error("Error adding question:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus soal ini beserta semua pilihan jawabannya?",
      )
    ) {
      return;
    }

    setDeleting(questionId);

    try {
      const { error: optionError } = await supabase
        .from("answer_options")
        .delete()
        .eq("question_id", questionId);

      if (optionError) throw optionError;

      const { error: questionError } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (questionError) throw questionError;

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setLocalQuestionTexts((prev) => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });

      const optionsToRemove =
        questions.find((q) => q.id === questionId)?.options.map((o) => o.id) ||
        [];

      setLocalOptionTexts((prev) => {
        const newState = { ...prev };
        optionsToRemove.forEach((optId) => {
          delete newState[optId];
        });
        return newState;
      });

      setUnsavedChanges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      alert(`Gagal menghapus soal: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleQuestionTextChange = (questionId: string, value: string) => {
    setLocalQuestionTexts((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    setUnsavedChanges((prev) => new Set(prev).add(questionId));
  };

  const handleOptionTextChange = (
    questionId: string,
    optionId: string,
    value: string,
  ) => {
    setLocalOptionTexts((prev) => ({
      ...prev,
      [optionId]: value,
    }));

    setUnsavedChanges((prev) => new Set(prev).add(questionId));
  };

  const saveQuestion = async (questionId: string) => {
    setSaving(questionId);

    try {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      const questionText = localQuestionTexts[questionId];
      if (!questionText || questionText.trim() === "") {
        alert("Teks pertanyaan tidak boleh kosong");
        return;
      }

      const { error: questionError } = await supabase
        .from("questions")
        .update({ question_text: questionText })
        .eq("id", questionId);

      if (questionError) throw questionError;

      const optionUpdates = question.options.map((opt) => ({
        id: opt.id,
        option_text: localOptionTexts[opt.id] || opt.option_text,
      }));

      for (const update of optionUpdates) {
        const { error: optionError } = await supabase
          .from("answer_options")
          .update({ option_text: update.option_text })
          .eq("id", update.id);

        if (optionError) throw optionError;
      }

      setUnsavedChanges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });

      const questionElement = document.getElementById(`question-${questionId}`);
      if (questionElement) {
        questionElement.classList.add("ring-2", "ring-emerald-500");
        setTimeout(() => {
          questionElement.classList.remove("ring-2", "ring-emerald-500");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error saving question:", error);
      alert(`Gagal menyimpan: ${error.message}`);
    } finally {
      setSaving(null);
    }
  };

  const setCorrect = async (questionId: string, optionId: string) => {
    try {
      const { error: unsetError } = await supabase
        .from("answer_options")
        .update({ is_correct: false })
        .eq("question_id", questionId);

      if (unsetError) throw unsetError;

      const { error: setError } = await supabase
        .from("answer_options")
        .update({ is_correct: true })
        .eq("id", optionId);

      if (setError) throw setError;

      const { error: updateQuestionError } = await supabase
        .from("questions")
        .update({ correct_option_id: optionId })
        .eq("id", questionId);

      if (updateQuestionError) throw updateQuestionError;

      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              correct_option_id: optionId,
              options: q.options.map((opt) => ({
                ...opt,
                is_correct: opt.id === optionId,
              })),
            };
          }
          return q;
        }),
      );

      const optionElement = document.getElementById(`option-${optionId}`);
      if (optionElement) {
        optionElement.classList.add("ring-2", "ring-emerald-500");
        setTimeout(() => {
          optionElement.classList.remove("ring-2", "ring-emerald-500");
        }, 500);
      }
    } catch (error: any) {
      console.error("Error setting correct answer:", error);
      alert(`Gagal menetapkan jawaban benar: ${error.message}`);
    }
  };

  const togglePublish = async () => {
    if (!assignment) return;

    if (!assignment.is_published) {
      if (questions.length === 0) {
        alert("Tidak dapat mempublikasikan tugas tanpa soal");
        return;
      }

      const questionsWithoutCorrectAnswer = questions.filter(
        (q) => !q.options.some((opt) => opt.is_correct),
      );

      if (questionsWithoutCorrectAnswer.length > 0) {
        const proceed = window.confirm(
          `Ada ${questionsWithoutCorrectAnswer.length} soal yang belum memiliki jawaban benar. Tetap publikasikan?`,
        );
        if (!proceed) return;
      }

      if (unsavedChanges.size > 0) {
        const proceed = window.confirm(
          `Ada ${unsavedChanges.size} soal dengan perubahan yang belum disimpan. Tetap publikasikan?`,
        );
        if (!proceed) return;
      }
    }

    try {
      const { error } = await supabase
        .from("assignments")
        .update({ is_published: !assignment.is_published })
        .eq("id", assignment.id);

      if (error) throw error;

      await fetchAll();
    } catch (error: any) {
      console.error("Error toggling publish:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-semibold">Memuat Editor...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Tugas tidak ditemukan
          </h2>
          <p className="text-slate-500">
            Assignment yang Anda cari tidak tersedia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        {/* Elegant Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/assignments")}
                className="group p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <ChevronLeft
                  size={24}
                  className="text-slate-600 group-hover:text-slate-900 transition-colors"
                />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {assignment.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500">
                    {assignment.course?.name}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-sm font-medium text-indigo-600">
                    {questions.length} Soal
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unsavedChanges.size > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold border border-amber-200/60">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  {unsavedChanges.size} perubahan belum disimpan
                </div>
              )}
              <button
                onClick={togglePublish}
                disabled={questions.length === 0}
                className={`group px-5 py-2.5 rounded-xl flex items-center gap-2.5 font-semibold transition-all duration-200 ${
                  assignment.is_published
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/30"
                    : questions.length === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30"
                }`}
              >
                {assignment.is_published ? (
                  <>
                    <EyeOff size={18} />
                    <span>Unpublish</span>
                  </>
                ) : (
                  <>
                    <Eye size={18} />
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {assignment.is_published && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Tugas telah dipublikasikan
              </p>
              <p className="text-sm text-blue-700/80">
                Mahasiswa dapat mengerjakan tugas ini. Perubahan yang Anda buat
                akan langsung terlihat.
              </p>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-5">
          {questions.map((q, i) => {
            const hasUnsavedChanges = unsavedChanges.has(q.id);
            const hasCorrectAnswer = q.options.some((opt) => opt.is_correct);

            return (
              <div
                key={q.id}
                id={`question-${q.id}`}
                className={`group bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                  hasUnsavedChanges
                    ? "border-amber-300 bg-amber-50/30"
                    : "border-slate-200/60 hover:border-indigo-200"
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                        {i + 1}
                      </div>
                      <span className="font-bold text-slate-900">
                        Soal #{i + 1}
                      </span>
                    </div>
                    {hasUnsavedChanges && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-semibold border border-amber-200/60">
                        Belum Disimpan
                      </span>
                    )}
                    {!hasCorrectAnswer && (
                      <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 border border-red-200/60">
                        <AlertCircle size={12} />
                        Tanpa Jawaban Benar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <button
                        onClick={() => saveQuestion(q.id)}
                        disabled={saving === q.id}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${
                          saving === q.id
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:shadow-md"
                        }`}
                        title="Simpan perubahan"
                      >
                        {saving === q.id ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Save size={16} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      disabled={deleting === q.id}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        deleting === q.id
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-red-100 text-red-600 hover:bg-red-200 hover:shadow-md"
                      }`}
                      title="Hapus soal"
                    >
                      {deleting === q.id ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-5 space-y-5">
                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      Pertanyaan
                    </label>
                    <textarea
                      value={localQuestionTexts[q.id] ?? q.question_text}
                      onChange={(e) =>
                        handleQuestionTextChange(q.id, e.target.value)
                      }
                      className="w-full p-4 border-2 border-slate-200 rounded-xl min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none font-medium text-slate-900 placeholder:text-slate-400"
                      placeholder="Masukkan pertanyaan di sini..."
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                      Pilihan Jawaban
                    </label>
                    <div className="space-y-3">
                      {q.options.map((opt, idx) => (
                        <div
                          key={opt.id}
                          id={`option-${opt.id}`}
                          className="flex gap-3 items-start group/option"
                        >
                          <button
                            onClick={() => setCorrect(q.id, opt.id)}
                            className={`flex-shrink-0 w-11 h-11 rounded-xl font-bold transition-all duration-200 flex items-center justify-center ${
                              opt.is_correct
                                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105"
                            }`}
                            title={
                              opt.is_correct
                                ? "Jawaban benar"
                                : "Klik untuk menjadikan jawaban benar"
                            }
                          >
                            {opt.is_correct ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <span className="text-base">
                                {String.fromCharCode(65 + idx)}
                              </span>
                            )}
                          </button>

                          <input
                            value={localOptionTexts[opt.id] ?? opt.option_text}
                            onChange={(e) =>
                              handleOptionTextChange(
                                q.id,
                                opt.id,
                                e.target.value,
                              )
                            }
                            className="flex-1 border-2 border-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-slate-900 placeholder:text-slate-400"
                            placeholder={`Opsi ${String.fromCharCode(65 + idx)}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button for Question */}
                  {hasUnsavedChanges && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => saveQuestion(q.id)}
                        disabled={saving === q.id}
                        className={`px-6 py-3 rounded-xl flex items-center gap-2.5 font-semibold transition-all duration-200 ${
                          saving === q.id
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30"
                        }`}
                      >
                        {saving === q.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          disabled={adding}
          className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
            adding
              ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
              : "border-indigo-300 text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-lg"
          }`}
        >
          {adding ? (
            <>
              <div className="w-10 h-10 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold">Menambahkan Soal...</span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Plus size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Tambah Soal Baru</p>
                <p className="text-sm text-slate-500 mt-1">
                  Klik untuk menambahkan soal pilihan ganda
                </p>
              </div>
            </>
          )}
        </button>

        {questions.length === 0 && !adding && (
          <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={40} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold text-lg">
              Belum ada soal
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Klik tombol di atas untuk menambahkan soal pertama
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentEditor;
