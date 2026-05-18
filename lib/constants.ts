export const API_ENDPOINTS = {
  // Admin Authentication
  ADMIN_LOGIN: '/admin/login/phone',
  ADMIN_LOGOUT: (id: string) => `/admin/${id}/logout`,
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_REFRESH_TOKEN: '/admin/refresh-token',

  // Students
  STUDENTS: '/students',
  STUDENT_BY_ID: (id: string) => `/students/${id}`,
  STUDENTS_BY_GROUP: (groupId: string) => `/students/group/${groupId}`,
  STUDENT_STATISTICS: (id: string) => `/students/${id}/statistics`,
  STUDENTS_BULK: '/students/bulk',
  STUDENT_PASSWORD: (id: string) => `/students/${id}/password`,

  // Teachers
  TEACHERS: '/teachers',
  TEACHER_BY_ID: (id: string) => `/teachers/${id}`,
  TEACHER_GROUPS: (id: string) => `/teachers/${id}/groups`,

  // Groups
  GROUPS: '/groups',
  GROUP_BY_ID: (id: string) => `/groups/${id}`,
  GROUP_STUDENTS: (id: string) => `/groups/${id}/students`,
  GROUP_ADD_STUDENT: (id: string, studentId: string) => `/groups/${id}/students/${studentId}`,
  GROUP_REMOVE_STUDENT: (id: string, studentId: string) => `/groups/${id}/students/${studentId}`,
  GROUP_LESSONS: (id: string) => `/groups/${id}/lessons`,

  // Group-Students
  GROUP_STUDENTS_RELATION: '/group-students',
  GROUP_STUDENTS_BY_ID: (id: string) => `/group-students/${id}`,
  GROUP_STUDENTS_BY_GROUP: (groupId: string) => `/group-students/group/${groupId}`,
  GROUP_STUDENTS_BY_STUDENT: (studentId: string) => `/group-students/student/${studentId}`,
  GROUP_STUDENTS_STATS: (groupId: string) => `/group-students/group/${groupId}/stats`,
  GROUP_STUDENTS_BULK_ADD: (groupId: string) => `/group-students/group/${groupId}/bulk-add`,
  GROUP_STUDENTS_BULK_REMOVE: (groupId: string) => `/group-students/group/${groupId}/bulk-remove`,

  // Levels
  LEVELS: '/levels',
  LEVEL_BY_ID: (id: string) => `/levels/${id}`,
  LEVELS_BULK: '/levels/bulk',
  LEVEL_UNITS: (id: string) => `/levels/${id}/units`,

  // Units
  UNITS: '/units',
  UNIT_BY_ID: (id: string) => `/units/${id}`,
  UNITS_BULK: '/units/bulk',
  UNIT_STATISTICS: (id: string) => `/units/${id}/statistics`,
  UNIT_EXERCISES: (id: string) => `/units/${id}/exercises`,

  // Exercises
  EXERCISES: '/exercises',
  EXERCISE_BY_ID: (id: string) => `/exercises/${id}`,
  EXERCISES_BY_UNIT: (unitId: string) => `/exercises/unit/${unitId}`,

  // Tasks
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASKS_BY_EXERCISE: (exerciseId: string) => `/tasks/exercise/${exerciseId}`,

  // Vocabulary
  VOCABULARY: '/vocabulary',
  VOCABULARY_BY_ID: (id: string) => `/vocabulary/${id}`,
};

export const APP_CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'BAHRIYEV Learning School',
  PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#1E40AF',
  SECONDARY_COLOR: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#FFFFFF',
  GRADIENT_START: process.env.NEXT_PUBLIC_GRADIENT_START || '#1E40AF',
  GRADIENT_END: process.env.NEXT_PUBLIC_GRADIENT_END || '#3B82F6',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  GROUPS: '/groups',
  LEVELS: '/lesson/levels',
  UNITS: '/lesson/units',
  EXERCISES: '/lesson/exercises',
  TASKS: '/lesson/tasks',
  VOCABULARY: '/lesson/vocabulary',
};
