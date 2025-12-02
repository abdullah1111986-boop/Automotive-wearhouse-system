import React from 'react';
import { LayoutDashboard, ArrowUpRight, ArrowDownLeft, History, Users, Box, Cpu, UserCircle } from 'lucide-react';
import { PageView } from '../types';

interface SidebarProps {
  currentPage: PageView;
  setPage: (page: PageView) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: LayoutDashboard },
    { id: 'checkout', label: 'تسليم عدة (خروج)', icon: ArrowUpRight },
    { id: 'return', label: 'استلام عدة (عودة)', icon: ArrowDownLeft },
    { id: 'inventory', label: 'العهد الخارجية', icon: Box },
    { id: 'trainer-view', label: 'قائمة المدربين', icon: Users },
    { id: 'history', label: 'سجل العمليات', icon: History },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden no-print"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-64 bg-slate-900 text-white z-30 transition-transform duration-300 ease-in-out shadow-xl no-print flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center gap-3 shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <Cpu size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">قسم التقنية الميكانيكية</h1>
            <p className="text-[10px] text-slate-400 mt-1">تخصص المحركات والمركبات</p>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id as PageView);
                  setIsOpen(false); // Close on mobile select
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-700">
             <button
                onClick={() => {
                  setPage('trainer-portal');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === 'trainer-portal'
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
                }`}
              >
                <UserCircle size={20} />
                <span className="font-medium">بوابة المدربين</span>
              </button>
          </div>
        </nav>
      </div>
    </>
  );
};