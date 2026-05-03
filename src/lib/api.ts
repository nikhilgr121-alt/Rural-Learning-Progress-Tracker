export interface Student {
  id: string;
  name: string;
  age: number;
  class: string;
  village: string;
}

export interface Progress {
  id: string;
  studentId: string;
  subject: string;
  lesson: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  score: number;
  date: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Stats {
  totalStudents: number;
  lessonsCompleted: number;
  averageScore: number;
}

export const api = {
  getStats: async (): Promise<Stats> => {
    const res = await fetch('/api/dashboard/stats');
    return res.json();
  },
  getStudents: async (): Promise<Student[]> => {
    const res = await fetch('/api/students');
    return res.json();
  },
  addStudent: async (student: Omit<Student, 'id'>): Promise<Student> => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    return res.json();
  },
  bulkAddStudents: async (students: Omit<Student, 'id'>[]): Promise<Student[]> => {
    const res = await fetch('/api/students/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(students),
    });
    return res.json();
  },
  updateStudent: async (id: string, student: Partial<Student>): Promise<Student> => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    return res.json();
  },
  deleteStudent: async (id: string): Promise<void> => {
    await fetch(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },
  getProgress: async (): Promise<Progress[]> => {
    const res = await fetch('/api/progress');
    return res.json();
  },
  addProgress: async (progress: Omit<Progress, 'id' | 'date'>): Promise<Progress> => {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
    return res.json();
  },
  batchAddProgress: async (studentId: string, lesson: string, entries: { subject: string, score: number, status: string }[]): Promise<Progress[]> => {
    const res = await fetch('/api/progress/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lesson, entries }),
    });
    return res.json();
  },
  getAttendance: async (date?: string): Promise<Attendance[]> => {
    const url = date ? `/api/attendance?date=${date}` : '/api/attendance';
    const res = await fetch(url);
    return res.json();
  },
  saveAttendance: async (records: Omit<Attendance, 'id'>[]): Promise<{ success: boolean }> => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    });
    return res.json();
  },
  getSubjects: async (): Promise<string[]> => {
    const res = await fetch('/api/subjects');
    return res.json();
  },
  addSubject: async (name: string): Promise<string[]> => {
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
};
