// types.ts - Type definitions for the student management system

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  nim?: string;
  role: "STUDENT" | "ADMIN";
  class_id?: string | null;
  semester_id?: string | null;
  avatar_url?: string | null;
  class?: {
    id: string;
    name: string;
  };
  semester?: {
    id: string;
    name: string;
  };
}

export interface Class {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface TaskCategory {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  course_id: string;
  semester_id: string;
  class_id: string;
  deadline: string;
  question_count: number;
  is_published: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  assignment_id: string;
  question_text: string;
  correct_option_id?: string;
  created_at: string;
}

export interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
}

export interface StudentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id: string;
}