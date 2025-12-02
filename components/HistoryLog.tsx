import React, { useState } from 'react';
import { Transaction } from '../types';
import { FileSpreadsheet, Printer, Calendar, Filter, X } from 'lucide-react';

interface HistoryLogProps {
  transactions: Transaction[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ transactions }) => {
  // State for filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter transactions based on date range
  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.checkoutTime);
    txDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    let isValid = true;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) isValid = false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (txDate > end) isValid = false;
    }

    return isValid;
  });

  // Reverse to show newest first
  const displayTransactions = [...filteredTransactions].reverse();

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['المعرف', 'اسم المعدة', 'اسم المدرب', 'تاريخ الخروج', 'وقت الخروج', 'تاريخ الإرجاع', 'وقت الإرجاع', 'الحالة'];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + displayTransactions.map(t => {
          const outDate = new Date(t.checkoutTime);
          const retDate = t.returnTime ? new Date(t.returnTime) : null;
          return [
            t.id,
            `"${t.itemName}"`,
            `"${t.trainerName}"`,
            outDate.toLocaleDateString('ar-SA'),
            outDate.toLocaleTimeString('ar-SA'),
            retDate ? retDate.toLocaleDateString('ar-SA') : '-',
            retDate ? retDate.toLocaleTimeString('ar-SA') : '-',
            t.isActive ? 'نشط' : 'مكتمل'
          ].join(",");
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
       {/* --- PRINT HEADER (Visible only when printing) --- */}
       <div className="print-only text-center mb-8 border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold mb-1">المملكة العربية السعودية</h2>
          <h3 className="text-lg font-bold mb-1">المؤسسة العامة للتدريب التقني والمهني</h3>
          <h3 className="text-lg font-bold mb-4">قسم التقنية الميكانيكية - تخصص المحركات والمركبات</h3>
          <h1 className="text-2xl font-black underline mb-2">تقرير حركة العهد والمستودع</h1>
          <p className="text-sm">
            تم استخراج التقرير بتاريخ: {new Date().toLocaleDateString('ar-SA')}
            {startDate && endDate && ` | الفترة من: ${startDate} إلى: ${endDate}`}
          </p>
       </div>

       {/* Screen Header & Controls */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 no-print">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">سجل العمليات والتقارير</h2>
            <p className="text-slate-500 text-sm">تصفية وطباعة تقارير حركة المستودع</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-100 border border-green-200"
            >
              <FileSpreadsheet size={18} />
              <span>تصدير Excel</span>
            </button>
            <button 
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"
            >
              <Printer size={18} />
              <span>طباعة التقرير</span>
            </button>
         </div>
       </div>

       {/* Filters Bar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 no-print flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold mb-2 w-full md:w-auto">
             <Filter size={20} />
             <span>تصفية حسب التاريخ:</span>
          </div>
          
          <div>
             <label className="block text-xs text-slate-500 mb-1">من تاريخ</label>
             <div className="relative">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-2 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Calendar size={16} className="absolute right-2.5 top-2.5 text-slate-400" />
             </div>
          </div>

          <div>
             <label className="block text-xs text-slate-500 mb-1">إلى تاريخ</label>
             <div className="relative">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-2 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Calendar size={16} className="absolute right-2.5 top-2.5 text-slate-400" />
             </div>
          </div>

          {(startDate || endDate) && (
            <button 
              onClick={clearFilters}
              className="mb-[2px] text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-2 bg-red-50 rounded-lg"
            >
              <X size={16} />
              مسح التصفية
            </button>
          )}

          <div className="mr-auto flex items-center gap-2 text-sm text-slate-500 pb-2">
             <span>عدد النتائج: <span className="font-bold text-slate-800">{displayTransactions.length}</span></span>
          </div>
       </div>
       
       {/* Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 text-slate-600 font-bold print:bg-slate-200 print:text-black">
              <tr>
                <th className="px-6 py-4 w-16 print:border print:border-black">#</th>
                <th className="px-6 py-4 print:border print:border-black">التاريخ</th>
                <th className="px-6 py-4 print:border print:border-black">المدرب المستلم</th>
                <th className="px-6 py-4 print:border print:border-black">العدة / الجهاز</th>
                <th className="px-6 py-4 print:border print:border-black">الحالة</th>
                <th className="px-6 py-4 print:border print:border-black">وقت الإرجاع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-black">
              {displayTransactions.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="px-6 py-3 font-mono text-slate-400 font-bold print:text-black print:border print:border-black">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500 print:text-black print:border print:border-black">
                    {new Date(t.checkoutTime).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900 print:text-black print:border print:border-black">{t.trainerName}</td>
                  <td className="px-6 py-3 text-slate-700 print:text-black print:border print:border-black">{t.itemName}</td>
                  <td className="px-6 py-3 print:border print:border-black">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold print:border print:border-black ${
                        t.isActive 
                        ? 'bg-amber-100 text-amber-700 print:bg-gray-200 print:text-black' 
                        : 'bg-green-100 text-green-700 print:bg-transparent print:text-black'
                    }`}>
                        {t.isActive ? 'في العهدة' : 'تم الإرجاع'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 print:text-black print:border print:border-black">
                    {t.returnTime 
                        ? new Date(t.returnTime).toLocaleString('ar-SA') 
                        : '-'}
                  </td>
                </tr>
              ))}
              {displayTransactions.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 print:text-black print:border print:border-black">
                          لا توجد عمليات مسجلة في هذه الفترة
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
       </div>

       {/* --- PRINT FOOTER (Visible only when printing) --- */}
       <div className="print-only mt-16 pt-8">
          <div className="flex justify-between px-12">
             <div className="text-center">
                <p className="font-bold mb-4">أمين المستودع</p>
                <p className="mb-2">م. علي الشمري</p>
                <div className="h-16 mt-2 border-b border-black w-48"></div>
             </div>
             <div className="text-center">
                <p className="font-bold mb-4">رئيس القسم</p>
                <p className="mb-2">م. عبدالله الزهراني</p>
                <div className="h-16 mt-2 border-b border-black w-48"></div>
             </div>
          </div>
          <div className="text-center mt-12 text-xs">
             <p>نظام إدارة العهد - قسم التقنية الميكانيكية</p>
          </div>
       </div>
    </div>
  );
};