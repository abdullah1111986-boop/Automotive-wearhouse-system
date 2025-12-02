import React, { useState } from 'react';
import { Transaction } from '../types';
import { ArrowLeft, Search, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReturnFormProps {
  transactions: Transaction[];
  onReturn: (transactionId: string) => void;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ transactions, onReturn }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Split transactions into Pending Approval and Active Loans
  const pendingReturns = transactions.filter(t => t.isActive && t.returnRequested);
  
  const activeLoans = transactions.filter(t => 
    t.isActive && 
    !t.returnRequested &&
    (t.itemName.includes(searchTerm) || t.trainerName.includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      
      {/* Pending Approvals Section - High Priority */}
      {pendingReturns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-amber-600" size={24} />
                <h3 className="text-lg font-bold text-amber-800">طلبات إرجاع بانتظار الموافقة</h3>
                <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">{pendingReturns.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReturns.map((t, index) => (
                    <div key={t.id} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex justify-between items-center">
                        <div className="flex gap-3">
                            <span className="bg-amber-100 text-amber-800 h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold mt-1">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-bold text-slate-800">{t.itemName}</p>
                                <p className="text-sm text-slate-600">المدرب: {t.trainerName}</p>
                                <p className="text-xs text-slate-400 mt-1">طلب المدرب إرجاع هذه العهدة</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onReturn(t.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
                        >
                            <CheckCircle2 size={16} />
                            موافق
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Manual Return Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-green-100 rounded-lg text-green-600">
                <ArrowLeft size={20} />
            </span>
            استلام عدة (إرجاع للمستودع)
            </h2>
            <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="بحث باسم المدرب أو المعدة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {activeLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                <p className="text-lg">لا توجد عهد خارجية نشطة</p>
                <p className="text-sm">أو لا توجد نتائج مطابقة للبحث</p>
            </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="px-6 py-3 text-sm font-medium text-slate-500 w-12">#</th>
                    <th className="px-6 py-3 text-sm font-medium text-slate-500">العدة / الجهاز</th>
                    <th className="px-6 py-3 text-sm font-medium text-slate-500">المدرب</th>
                    <th className="px-6 py-3 text-sm font-medium text-slate-500">وقت الخروج</th>
                    <th className="px-6 py-3 text-sm font-medium text-slate-500">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activeLoans.map((t, index) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs font-bold">
                            {index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{t.itemName}</td>
                        <td className="px-6 py-4 text-slate-600">{t.trainerName}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm flex items-center gap-2">
                            <Clock size={14} />
                            {new Date(t.checkoutTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}
                            <span className="text-xs text-slate-400">
                                ({new Date(t.checkoutTime).toLocaleDateString('ar-SA')})
                            </span>
                        </td>
                        <td className="px-6 py-4">
                        <button
                            onClick={() => onReturn(t.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            تأكيد الإرجاع
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};