import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateInventoryReport = async (transactions: Transaction[], query: string): Promise<string> => {
  if (!apiKey) {
    return "عذراً، مفتاح API غير متوفر.";
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: context },
        { text: query }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple responses
      }
    });

    return response.text || "لم أتمكن من تحليل البيانات حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};
