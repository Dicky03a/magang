import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Assignment, Question, AnswerOption, Profile } from "../types";
import {
  performGrading,
  getGradeColorClass,
  convertScoreToGrade,
} from "../lib/grading";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ClipboardList,
  Home,
  Award,
  Target,
} from "lucide-react";

interface WorkspaceProps {
  profile: Profile;
}

const AssignmentWorkspace: React.FC<WorkspaceProps> = ({ profile }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [letterGrade, setLetterGrade] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);

      try {
        // Check if already submitted
        const { data: existingSub, error: subError } = await supabase
          .from("submissions")
          .select("*")
          .eq("assignment_id", id)
          .eq("student_id", profile.id)
          .maybeSingle();

        if (subError && subError.code !== "PGRST116") {
          throw subError;
        }

        if (existingSub) {
          alert("Anda sudah mengerjakan tugas ini.");
          navigate("/student");
          return;
        }

        // Fetch assignment data
        const { data: assignData, error: assignError } = await supabase
          .from("assignments")
          .select("*, course:courses(name)")
          .eq("id", id)
          .single();

        if (assignError) throw assignError;

        if (!assignData) {
          alert("Tugas tidak ditemukan.");
          navigate("/student");
          return;
        }

        // Check if assignment is published
        if (!assignData.is_published) {
          alert("Tugas ini belum dipublikasikan.");
          navigate("/student");
          return;
        }

        setAssignment(assignData);

        // Fetch all questions for the assignment
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id, assignment_id, question_text")
          .eq("assignment_id", id)
          .order("created_at", { ascending: true });

        if (questionsError) throw questionsError;

        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map((q) => q.id);

          // Fetch all answer options for those questions
          const { data: optionsData, error: optionsError } = await supabase
            .from("answer_options")
            .select("id, question_id, option_text")
            .in("question_id", questionIds)
            .order("option_text", { ascending: true });

          if (optionsError) throw optionsError;

          // Combine questions with their options
          const questionsWithOptions = questionsData.map((question) => {
            const options =
              optionsData?.filter(
                (option) => option.question_id === question.id,
              ) || [];
            return {
              ...question,
              options,
            };
          });

          setQuestions(questionsWithOptions);
        } else {
          setQuestions([]);
          alert("Tugas ini belum memiliki soal.");
        }
      } catch (error: any) {
        console.error("Error fetching assignment:", error);
        alert(`Error: ${error.message || "Gagal memuat tugas"}`);
        navigate("/student");
      } finally {
        setLoading(false);
      }
    };

    if (id && profile?.id) {
      fetchAssignment();
    }
  }, [id, profile, navigate]);

  // Calculate time remaining
  useEffect(() => {
    if (!assignment?.deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(assignment.deadline).getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setTimeRemaining("Waktu Habis");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}h ${hours}j ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}d`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignment?.deadline]);

  // Check if all questions have been answered
  const allQuestionsAnswered =
    questions.length > 0 &&
    Object.keys(selectedAnswers).length === questions.length;

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions have been answered
    if (!allQuestionsAnswered) {
      const confirmPartialSubmission = window.confirm(
        `Anda belum menjawab semua soal (${Object.keys(selectedAnswers).length}/${questions.length}). Tetap ingin mengumpulkan jawaban?`,
      );
      if (!confirmPartialSubmission) return;
    } else {
      if (!window.confirm("Apakah Anda yakin ingin mengumpulkan jawaban?"))
        return;
    }

    setSubmitting(true);

    try {
      const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        question_id: qId,
        selected_option_id: oId,
      }));

      // Call the secure RPC function
      const { data, error } = await supabase.rpc("submit_assignment", {
        p_assignment_id: id,
        p_student_id: profile.id,
        p_answers: answers,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }

      const result = data as any;

      setFinalScore(result.score);
      setLetterGrade(convertScoreToGrade(result.score));

      if (result.details) {
        const details = result.details;
        const updatedQuestions = [...questions];

        details.forEach((detail: any) => {
          const questionIdx = updatedQuestions.findIndex(
            (q) => q.id === detail.question_id,
          );
          if (questionIdx !== -1) {
            updatedQuestions[questionIdx] = {
              ...updatedQuestions[questionIdx],
              correct_option_id: detail.correct_option_id,
            };
          }
        });

        setQuestions(updatedQuestions);
      }

      setIsDone(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(
        "Error: " +
          (err.message || "Terjadi kesalahan saat mengumpulkan jawaban"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-semibold text-sm sm:text-base">
            Memuat tugas...
          </p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tugas Tidak Ditemukan
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Tugas yang Anda cari tidak tersedia atau sudah dihapus.
            </p>
          </div>
          <button
            onClick={() => navigate("/student")}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300 delay-150">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Tugas Terkirim!
              </h2>
              <p className="text-teal-100 text-sm sm:text-base">
                Jawaban Anda telah berhasil kami simpan
              </p>
            </div>

            {/* Score Section */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Numeric Score */}
                <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 text-center border-2 border-teal-200 animate-in slide-in-from-left duration-500 delay-300">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-teal-600" />
                    <span className="text-sm font-bold text-teal-700 uppercase tracking-wide">
                      Nilai Angka
                    </span>
                  </div>
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                    {finalScore}%
                  </span>
                </div>

                {/* Letter Grade */}
                <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 text-center border-2 border-teal-200 animate-in slide-in-from-right duration-500 delay-300">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-teal-600" />
                    <span className="text-sm font-bold text-teal-700 uppercase tracking-wide">
                      Nilai Huruf
                    </span>
                  </div>
                  <span
                    className={`text-4xl sm:text-5xl font-black ${getGradeColorClass(letterGrade).split(" ")[1]}`}
                  >
                    {letterGrade}
                  </span>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 sm:p-5 mb-6 animate-in fade-in duration-500 delay-500">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-teal-800">
                    Untuk melihat detail jawaban dan pembahasan, silakan hubungi
                    pengajar Anda.
                  </p>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => navigate("/student")}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Belum Ada Soal
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Tugas ini belum memiliki soal. Silakan hubungi pengajar Anda.
            </p>
          </div>
          <button
            onClick={() => navigate("/student")}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
            {/* Left Section - Title */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900 truncate">
                  {assignment.title}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                  {assignment.course?.name}
                </p>
              </div>
            </div>

            {/* Right Section - Timer */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-orange-50 border border-orange-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs font-semibold text-orange-700">
                    {timeRemaining}
                  </div>
                  <div className="text-[8px] sm:text-[10px] text-orange-600 hidden sm:block">
                    {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 w-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-teal-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Question Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-4 sm:mb-6">
          <div className="p-4 sm:p-6 lg:p-10">
            {/* Question Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md">
                  Soal {currentIndex + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  dari {questions.length}
                </span>
              </div>

              <div
                className={`
                text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2
                ${
                  selectedAnswers[currentQuestion?.id]
                    ? "bg-green-50 text-green-700 border-green-300"
                    : "bg-slate-50 text-slate-600 border-slate-300"
                }
              `}
              >
                {selectedAnswers[currentQuestion?.id] ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Terjawab
                  </span>
                ) : (
                  "Belum Terjawab"
                )}
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
              {currentQuestion?.question_text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3 sm:space-y-4">
              {currentQuestion?.options.map((option: any, idx: number) => {
                const isSelected =
                  selectedAnswers[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                    className={`
                      w-full text-left p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 transition-all
                      flex items-start gap-3 sm:gap-4 group
                      ${
                        isSelected
                          ? "border-teal-500 bg-teal-50 shadow-lg ring-2 ring-teal-200"
                          : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-md"
                      }
                    `}
                  >
                    {/* Radio Button */}
                    <div
                      className={`
                      mt-0.5 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 
                      flex items-center justify-center transition-all
                      ${
                        isSelected
                          ? "border-teal-600 bg-teal-600 shadow-md"
                          : "border-slate-400 group-hover:border-teal-500"
                      }
                    `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>

                    {/* Option Text */}
                    <span
                      className={`
                      font-medium flex-grow text-sm sm:text-base lg:text-lg transition-colors
                      ${isSelected ? "text-teal-900" : "text-slate-700"}
                    `}
                    >
                      {option.option_text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 pb-20 md:pb-6">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`
                px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg transition-all
                ${
                  allQuestionsAnswered
                    ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                }
                ${submitting ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"}
              `}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Mengirim...</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : allQuestionsAnswered ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Selesai & Kumpulkan</span>
                  <span className="sm:hidden">Kirim</span>
                </span>
              ) : (
                <span className="text-xs sm:text-sm lg:text-base">
                  Kumpulkan (
                  {questions.length - Object.keys(selectedAnswers).length}{" "}
                  belum)
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Question Navigator */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-2 sm:p-3 md:hidden z-50 shadow-2xl">
        <div className="flex gap-1.5 overflow-x-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers.hasOwnProperty(q.id);
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl
                  text-xs sm:text-sm font-bold flex items-center justify-center
                  transition-all border-2
                  ${
                    isCurrent
                      ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500 shadow-lg scale-110"
                      : isAnswered
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-slate-100 text-slate-500 border-slate-300"
                  }
                `}
              >
                {idx + 1}
                {!isAnswered && !isCurrent && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full text-[8px] sm:text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Question Navigator Sidebar */}
      <div className="hidden md:block fixed right-4 lg:right-6 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl border-2 border-slate-200 p-3 lg:p-4 shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 z-30">
        <h3 className="text-xs lg:text-sm font-bold text-slate-700 px-2 mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Navigasi Soal
        </h3>
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers.hasOwnProperty(q.id);
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  relative w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl
                  text-xs lg:text-sm font-bold flex items-center justify-center
                  transition-all border-2
                  ${
                    isCurrent
                      ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-500 shadow-lg scale-110"
                      : isAnswered
                        ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                        : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                  }
                `}
                title={`Soal ${idx + 1} ${isAnswered ? "(Terjawab)" : "(Belum Terjawab)"}`}
              >
                {idx + 1}
                {!isAnswered && !isCurrent && (
                  <span className="absolute w-3.5 h-3.5 lg:w-4 lg:h-4 bg-red-500 rounded-full text-[8px] lg:text-[10px] text-white flex items-center justify-center font-bold -top-1 -right-1 border-2 border-white">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignmentWorkspace;
