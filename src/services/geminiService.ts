import { GoogleGenAI } from "@google/genai";
import { Student, Progress, Attendance } from "../lib/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeStudentPerformance(
  student: Student,
  progress: Progress[],
  attendance: Attendance[]
): Promise<string> {
  const prompt = `
    Analyze the performance of this student in a rural educational setting.
    
    Student Profile:
    - Name: ${student.name}
    - Age: ${student.age}
    - Class: ${student.class}
    - Village: ${student.village || 'Unassigned'}
    
    Academic Progress (Last entries):
    ${JSON.stringify(progress.slice(-10), null, 2)}
    
    Attendance Record (Last entries):
    ${JSON.stringify(attendance.slice(-10), null, 2)}
    
    CRITICAL ANALYSIS REQUIREMENT:
    Directly correlate the attendance percentage with the average marks. Comment on whether low attendance is driving poor scores, or if high attendance is failing to translate to better grades.
    
    Please provide a concise analysis in 3-4 bullet points focusing on:
    1. Overall academic trend (improving or declining).
    2. Explicitly link how their attendance (regularity) has influenced their test scores.
    3. Subject-specific strengths and weaknesses.
    4. One specific recommendation for the teacher to help this student.
    
    Format the output as clean, empathetic, professional prose. Do not use markdown bold markers (**). Just clear, concise bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text ?? "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function predictPerformance(
  student: Student,
  progress: Progress[],
  attendance: Attendance[]
): Promise<"Excellent" | "Average" | "Weak"> {
  const prompt = `
    Based on the student's data, categorize their performance as exactly one of: "Excellent", "Average", or "Weak".
    
    Student: ${student.name}
    Academic Progress: ${JSON.stringify(progress.slice(-10))}
    Attendance: ${JSON.stringify(attendance.slice(-10))}
    
    Return ONLY the word: "Excellent", "Average", or "Weak".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const result = response.text?.trim().replace(/[^a-zA-Z]/g, '') || "Average";
    if (["Excellent", "Average", "Weak"].includes(result)) {
      return result as "Excellent" | "Average" | "Weak";
    }
    return "Average";
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return "Average";
  }
}

export async function analyzeRegionalPerformance(
  villageName: string,
  students: Student[],
  progress: Progress[],
  attendance: Attendance[]
): Promise<string> {
  const prompt = `
    Provide a regional educational analysis for the village of "${villageName}".
    
    Data Snapshot:
    - Total Students: ${students.length}
    - Student Profiles: ${students.map(s => `${s.name} (${s.class})`).join(', ')}
    - Recent Progress Records: ${JSON.stringify(progress.slice(-15))}
    - Recent Attendance: ${JSON.stringify(attendance.slice(-15))}
    
    Goal:
    As an expert rural education advisor, analyze this specific village's data. 
    1. Identify if the village as a whole is performing above or below the expected average.
    2. Highlight any specific class (grade) that seems to be struggling.
    3. Suggest one community-level intervention (e.g., after-school club, parent meeting) based on the trends.
    
    Format: 3-4 bullet points. No markdown bold. Professional and actionable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text ?? "Regional analysis unavailable.";
  } catch (error) {
    console.error("Regional Analysis Error:", error);
    throw error;
  }
}

