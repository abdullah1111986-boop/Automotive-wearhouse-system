import React, { useState } from 'react';
import { Transaction, ItemStatus, Item } from '../types';
import { Activity, CheckCircle, Bot } from 'lucide-react';
import { generateInventoryReport } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  items: Item[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, items }) => {
  const activeLoans = transactions.filter(t => t.isActive);
  const totalItems = items.length;
  const availableCount = items.filter(i => i.status === ItemStatus.AVAILABLE).length;

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    const response = await generateInventoryReport(transactions, aiQuery);
    setAiResponse(response);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border-r-4 border-blue-500">
        <h2 className="text-xl md:text-2xl font-bold mb-1">قسم التقنية الميكانيكية</h2>
        <h3 className="text-lg text-blue-200 mb-2">تخصص المحركات والمركبات</h3>
        <p className="text-sm text-slate-400 border-t border-slate-700 pt-2 inline-block">نظام إدارة العهد بالمستودع</p>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">العهد الخارجية النشطة</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-2">{activeLoans.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">عمليات تسليم لم تُرجع بعد</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">العدد المتاحة</p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">{availableCount}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">من إجمالي {totalItems} قطعة</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي العمليات</p>
              <h3 className="text-3xl font-bold text-purple-600 mt-2">{transactions.length}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <HistoryCardIcon />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">عمليات استلام وتسليم مسجلة</p>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="text-yellow-400" />
          <h3 className="text-lg font-bold">المساعد الذكي للمستودع</h3>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          يمكنك الاستفسار عن حالة المستودع، أكثر المدربين استعارة، أو ملخص العمليات اليومية.
        </p>
        
        <form onSubmit={handleAiAsk} className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="مثال: من هو أكثر مدرب أخذ معدات هذا الأسبوع؟"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={isAiLoading}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isAiLoading ? 'جاري التحليل...' : 'اسأل'}
          </button>
        </form>

        {aiResponse && (
          <div className="bg-white/10 p-4 rounded-lg border border-white/10 animate-fade-in">
            <p className="text-sm leading-relaxed whitespace-pre-line">{aiResponse}</p>
          </div>
        )}
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">آخر 5 عمليات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium w-12">#</th>
                <th className="px-6 py-3 font-medium">المدرب</th>
                <th className="px-6 py-3 font-medium">العدة</th>
                <th className="px-6 py-3 font-medium">الوقت</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice().reverse().slice(0, 5).map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-400 font-mono text-xs font-bold">{index + 1}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{t.trainerName}</td>
                  <td className="px-6 py-3 text-slate-600">{t.itemName}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                    {new Date(t.checkoutTime).toLocaleString('ar-SA')}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.isActive ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {t.isActive ? 'بالخارج' : 'تم الإرجاع'}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">لا توجد عمليات مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const HistoryCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
);