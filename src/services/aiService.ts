import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const aiService = {
  getChatResponse: async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], appContext?: string) => {
    try {
      const baseInstruction = "You are 'EDU', a friendly and highly capable AI assistant for the Rural Learning Progress Tracker app. You help teachers and admins manage student data, subjects, and understand student performance. Be supportive, concise, and professional. You use a gentle, encouraging tone and provide actionable insights based on the context of rural education.";
      
      const systemInstruction = appContext 
        ? `${baseInstruction}\n\nCURRENT CONTEXT:\n${appContext}\n\nPlease use this data to provide specific answers. If the user asks about students or performance, refer to the context provided above.`
        : baseInstruction;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction
      });

      // Gemini requires history to start with a 'user' message
      const firstUserIdx = history.findIndex(m => m.role === 'user');
      const filteredHistory = firstUserIdx === -1 ? [] : history.slice(firstUserIdx);

      const chat = model.startChat({
        history: filteredHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Error:", error);
      return "I'm having a little trouble connecting right now. Let's try again in a moment.";
    }
  }
};
