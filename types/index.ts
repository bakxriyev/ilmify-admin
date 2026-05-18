// Admin Types
export interface Admin {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  photo?: string;
  password?: string;
}


export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  message: string;      // Backend message qaytaryapti
  access_token: string; // Backend access_token qaytaryapti (accessToken emas)
  refresh_token?: string; // Backend refresh_token qaytaryapti
  admin: Admin;
}


export interface CreateStudentRequest {
  first_name: string;
  last_name: string;
  age: number;
  email?: string;
  phone_number: string;
  password: string;
  group_id?: number;
  photo?: string;
}

export interface UpdateStudentRequest {
  first_name?: string;
  last_name?: string;
  age?: number;
  email?: string;
  phone_number?: string;
  photo?: string;
  group_id?: number;
}

// Teacher Types
export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  gmail: string;
  phone_number: string;
  photo?: string;
  groups?: Group[];
}

export interface CreateTeacherRequest {
  first_name: string;
  last_name: string;
  gmail: string;
  phone_number: string;
  password: string;
  photo?: string;
}

export interface UpdateTeacherRequest {
  first_name?: string;
  last_name?: string;
  gmail?: string;
  phone_number?: string;
  photo?: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  teacher_id: number;
  support_teacher_id?: number;
  level_id: number;
  start_date?: string;
  duration_months?: number;
  time?: string;
  parity?: 'odd' | 'even';
  teacher?: Teacher;
  support_teacher?: Teacher;
  level?: Level;
  students?: Student[];
}

export interface CreateGroupRequest {
  name: string;
  teacher_id: number;
  support_teacher_id?: number;
  level_id: number;
  start_date?: string;
  duration_months?: number;
  time?: string;
  parity?: 'odd' | 'even';
}

export interface UpdateGroupRequest {
  name?: string;
  teacher_id?: number;
  support_teacher_id?: number;
  level_id?: number;
  start_date?: string;
  duration_months?: number;
  time?: string;
  parity?: 'odd' | 'even';
}

// Level Types
export interface Level {
  id: string;
  name: string;
  title: string;
  description?: string;
  units?: Unit[];
  units_count?: number;
}

export interface CreateLevelRequest {
  name: string;
  title: string;
  description?: string;
}

export interface UpdateLevelRequest {
  name?: string;
  title?: string;
  description?: string;
}

// Unit Types
export interface Unit {
  id: string;
  name: string;
  unit_number: string;
  title: string;
  description?: string;
  level_id: number;
  level?: Level;
  exercises?: Exercise[];
  exercises_count?: number;
  vocabs_count?: number;
  students_count?: number;
}

export interface CreateUnitRequest {
  name: string;
  unit_number: string;
  title: string;
  description?: string;
  level_id: number;
}

export interface UpdateUnitRequest {
  name?: string;
  unit_number?: string;
  title?: string;
  description?: string;
  level_id?: number;
}

// Exercise Types
export interface Exercise {
  id: string;
  unit_id: number;
  name: string;
  description?: string;
  number: number;
  type: string;
  qText?: string;
  unit?: Unit;
  tasks?: Task[];
}

export interface CreateExerciseRequest {
  unit_id: number;
  name: string;
  description?: string;
  number: number;
  type: string;
  qText?: string;
}

export interface UpdateExerciseRequest {
  unit_id?: number;
  name?: string;
  description?: string;
  number?: number;
  type?: string;
  qText?: string;
}

// Task Types
export interface Task {
  id: string;
  exercise_id: number;
  question_text?: string;
  media?: string;
  correct_answer?: string;
  extra_data?: string;
  photo?: string;
  title?: string;
  description?: string;
  writing_q?: string;
  audio?: string;
  video?: string;
  ordinary_number?: number;
  exercise?: Exercise;
}

export interface CreateTaskRequest {
  exercise_id: number;
  question_text?: string;
  media?: string;
  correct_answer?: string;
  extra_data?: string;
  photo?: string;
  title?: string;
  description?: string;
  writing_q?: string;
  audio?: string;
  video?: string;
  ordinary_number?: number;
}

export interface UpdateTaskRequest {
  exercise_id?: number;
  question_text?: string;
  media?: string;
  correct_answer?: string;
  extra_data?: string;
  photo?: string;
  title?: string;
  description?: string;
  writing_q?: string;
  audio?: string;
  video?: string;
  ordinary_number?: number;
}

// Vocabulary Types
export interface Vocabulary {
  id: string;
  word: string;
  translation?: string;
  definition?: string;
  example?: string;
  audio?: string;
  image?: string;
  unit_id?: number;
  unit?: Unit;
}

export interface CreateVocabularyRequest {
  word: string;
  translation?: string;
  definition?: string;
  example?: string;
  audio?: string;
  image?: string;
  unit_id?: number;
}

export interface UpdateVocabularyRequest {
  word?: string;
  translation?: string;
  definition?: string;
  example?: string;
  audio?: string;
  image?: string;
  unit_id?: number;
}

// Group-Student Relation Types
export interface GroupStudent {
  id: string;
  group_id: number;
  student_id: number;
  joined_date: string;
  group?: Group;
  student?: Student;
}

export interface CreateGroupStudentRequest {
  group_id: number;
  student_id: number;
  joined_date?: string;
}


export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TeachersResponse {
  data: Teacher[];
  meta: PaginationMeta;
}

// types.ts
// types.ts
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  email?: string | null;
  phone_number: string;
  photo?: string | null;
  group_id?: number | null;
  group?: {
    id: number;
    name: string;
    description?: string;
  } | null;
}
export interface CreateStudentRequest {
  first_name: string;
  last_name: string;
  age: number;
  email?: string;
  phone_number: string;
  password: string;
  group_id?: number;
  photo?: string;
}