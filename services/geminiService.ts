import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

// Safely access environment variables in Vite/Vercel environment
const getApiKey = () => {
  try {
    // @ts-ignore - Vite specific
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error
  }
  
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error
  }
  
  return '';
};

export const generateInventoryReport = async (transactions: Transaction[], query: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "عذراً، مفتاح API غير متوفر. يرجى إضافته في إعدادات Vercel.";
  }

  // Filter for relevant data to send to LLM to save tokens
  const recentTransactions = transactions.slice(-50); // Send last 50 transactions for context
  const activeLoans = transactions.filter(t => t.isActive);

  const context = `
    أنت مساعد ذكي لنظام إدارة مستودع قسم تقنية المحركات والمركبات.
    المشرف العام: م. عبدالله الزهراني.
    أمين المستودع: م. علي الشمري.
    
    البيانات الحالية:
    - عدد العمليات النشطة (لم يتم إرجاعها): ${activeLoans.length}
    - آخر العمليات المسجلة: ${JSON.stringify(recentTransactions.map(t => ({
      item: t.itemName,
      trainer: t.trainerName,
      out: t.checkoutTime,
      returned: t.returnTime || 'Not yet'
    })))}

    أجب على استفسار المستخدم بناءً على هذه البيانات باللغة العربية. كن مختصراً ومفيداً.
  `;

  try {
    // Lazy initialization: create instance only when needed
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: context },
        { text: query }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "لم أتمكن من تحليل البيانات حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};