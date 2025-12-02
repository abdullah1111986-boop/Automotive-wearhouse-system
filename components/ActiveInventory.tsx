import React from 'react';
import { Transaction } from '../types';
import { Box } from 'lucide-react';

interface ActiveInventoryProps {
  transactions: Transaction[];
}

export const ActiveInventory: React.FC<ActiveInventoryProps> = ({ transactions }) => {
  const activeLoans = transactions.filter(t => t.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-amber-100 p-2 rounded-lg">
             <Box className="text-amber-600" size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">قائمة العهد الخارجية</h2>
            <p className="text-slate-500 text-sm">قائمة بجميع العدد والأدوات الموجودة خارج المستودع حالياً</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeLoans.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
             <h3 className="font-bold text-lg text-slate-800 mb-1">{t.itemName}</h3>
             <div className="text-sm text-slate-500 mb-4">
                <span className="block">بحوزة: <span className="text-slate-900 font-medium">{t.trainerName}</span></span>
                <span className="block mt-1 text-xs">منذ: {new Date(t.checkoutTime).toLocaleString('ar-SA')}</span>
             </div>
             <div className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded">
                ID: {t.itemId.substring(0, 8)}...
             </div>
          </div>
        ))}
        
        {activeLoans.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-400">المستودع مكتمل - لا توجد عهد خارجية</p>
            </div>
        )}
      </div>
    </div>
  );
};
