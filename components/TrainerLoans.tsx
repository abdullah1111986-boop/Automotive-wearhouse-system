
import React, { useState } from 'react';
import { Transaction, Trainer } from '../types';
import { Users, ChevronDown, ChevronUp, Trash2, UserPlus, Save, X, KeyRound, AlertTriangle, Lock } from 'lucide-react';

interface TrainerLoansProps {
  transactions: Transaction[];
  trainers: Trainer[];
  onAddTrainer: (name: string) => void;
  onDeleteTrainer: (id: string) => void;
  onUpdatePassword: (id: string, newPass: string) => void;
}

export const TrainerLoans: React.FC<TrainerLoansProps> = ({ transactions, trainers, onAddTrainer, onDeleteTrainer, onUpdatePassword }) => {
  const [expandedTrainer, setExpandedTrainer] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState('');

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTrainerForPassword, setSelectedTrainerForPassword] = useState<Trainer | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrainerForDelete, setSelectedTrainerForDelete] = useState<Trainer | null>(null);

  const toggleTrainer = (id: string) => {
    setExpandedTrainer(expandedTrainer === id ? null : id);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrainerName.trim()) {
        onAddTrainer(newTrainerName.trim());
        setNewTrainerName('');
        setIsAdding(false);
    }
  };

  // --- Handlers for opening Modals ---
  const openDeleteModal = (e: React.MouseEvent, trainer: Trainer) => {
      e.stopPropagation(); // Stop click from bubbling to accordion
      e.preventDefault();
      setSelectedTrainerForDelete(trainer);
      setShowDeleteModal(true);
  };

  const openPasswordModal = (e: React.MouseEvent, trainer: Trainer) => {
      e.stopPropagation(); // Stop click from bubbling to accordion
      e.preventDefault();
      setSelectedTrainerForPassword(trainer);
      setNewPasswordInput(trainer.password || '');
      setShowPasswordModal(true);
  };

  // --- Actions ---
  const confirmDelete = () => {
      if (selectedTrainerForDelete) {
          onDeleteTrainer(selectedTrainerForDelete.id);
          setShowDeleteModal(false);
          setSelectedTrainerForDelete(null);
      }
  };

  const confirmPasswordUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedTrainerForPassword && newPasswordInput.trim()) {
          onUpdatePassword(selectedTrainerForPassword.id, newPasswordInput.trim());
          setShowPasswordModal(false);
          setSelectedTrainerForPassword(null);
      }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="text-purple-600" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">قائمة المدربين</h2>
                <p className="text-slate-500 text-sm">إدارة المدربين، كلمات المرور، وسجل العهد</p>
            </div>
        </div>
        
        {!isAdding && (
            <button 
                type="button"
                onClick={() => setIsAdding(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
                <UserPlus size={18} />
                إضافة مدرب جديد
            </button>
        )}
      </div>

      {/* Add Trainer Form */}
      {isAdding && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 animate-fade-in">
              <form onSubmit={handleAddSubmit} className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                  <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-purple-800 mb-1">اسم المدرب</label>
                      <input 
                        type="text" 
                        value={newTrainerName}
                        onChange={(e) => setNewTrainerName(e.target.value)}
                        placeholder="الاسم الثلاثي..."
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                      <p className="text-xs text-purple-400 mt-1">الرقم السري الافتراضي سيكون 1234</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        type="submit"
                        disabled={!newTrainerName.trim()}
                        className="flex-1 md:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Save size={16} /> حفظ
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="flex-1 md:flex-none bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 hover:bg-slate-50"
                    >
                        <X size={16} /> إلغاء
                    </button>
                  </div>
              </form>
          </div>
      )}

      {/* Trainers List */}
      <div className="space-y-4">
        {trainers.map(trainer => {
          const trainerLoans = transactions.filter(t => t.isActive && t.trainerId === trainer.id);
          const historyCount = transactions.filter(t => t.trainerId === trainer.id).length;
          const isExpanded = expandedTrainer === trainer.id;
          const hasActiveLoans = trainerLoans.length > 0;

          return (
            <div key={trainer.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
              <div className="w-full flex items-center justify-between p-4 pl-2 relative">
                
                {/* Clickable Area for Accordion */}
                <div 
                    onClick={() => toggleTrainer(trainer.id)}
                    className="flex-1 flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors mr-2 select-none"
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${hasActiveLoans ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {trainer.name.charAt(0)}
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-slate-800">{trainer.name}</h3>
                        <p className="text-xs text-slate-500">
                            {trainerLoans.length} عهدة حالية | {historyCount} إجمالي العمليات
                        </p>
                    </div>
                    {hasActiveLoans && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium hidden md:inline-block">
                            يوجد عهد
                        </span>
                    )}
                </div>

                {/* Actions Container - High Z-Index to ensure clickability */}
                <div className="flex items-center gap-1 md:gap-2 relative z-10">
                    <button 
                        type="button"
                        onClick={(e) => openPasswordModal(e, trainer)}
                        className="p-2 rounded-full transition-colors text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                        title="إعادة تعيين كلمة المرور"
                    >
                        <KeyRound size={20} />
                    </button>
                    
                    <button 
                        type="button"
                        onClick={(e) => openDeleteModal(e, trainer)}
                        className="p-2 rounded-full transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100"
                        title="حذف المدرب"
                    >
                        <Trash2 size={20} />
                    </button>

                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    <button
                        type="button"
                        onClick={() => toggleTrainer(trainer.id)}
                        className="p-2 text-slate-400 hover:text-slate-600"
                    >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100 p-5">
                    {trainerLoans.length > 0 ? (
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3">العدد التي بحوزته حالياً:</h4>
                            <ul className="space-y-2">
                                {trainerLoans.map(loan => (
                                    <li key={loan.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="font-medium text-slate-800">{loan.itemName}</span>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(loan.checkoutTime).toLocaleDateString('ar-SA')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-4 border-2 border-dashed border-slate-200 rounded-lg">
                            لا توجد عهد مسجلة باسمه حالياً (بريء الذمة)
                        </p>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- PASSWORD MODAL --- */}
      {showPasswordModal && selectedTrainerForPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <KeyRound size={20} className="text-blue-600" />
                        تغيير كلمة المرور
                    </h3>
                    <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={confirmPasswordUpdate} className="p-6">
                    <p className="text-slate-600 mb-4">
                        المدرب: <span className="font-bold text-slate-800">{selectedTrainerForPassword.name}</span>
                    </p>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور الجديدة</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                                placeholder="أدخل كلمة المرور"
                                autoFocus
                            />
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
                            إلغاء
                        </button>
                        <button type="submit" disabled={!newPasswordInput.trim()} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                            حفظ التغييرات
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && selectedTrainerForDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-red-50 p-6 text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-red-800 mb-2">حذف المدرب</h3>
                    <p className="text-red-600 font-medium">{selectedTrainerForDelete.name}</p>
                </div>
                
                <div className="p-6">
                    {transactions.some(t => t.trainerId === selectedTrainerForDelete.id && t.isActive) ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                            <div className="text-sm text-amber-800">
                                <p className="font-bold mb-1">تنبيه: توجد عهد نشطة!</p>
                                <p>سيتم إرجاع جميع العهد المسجلة باسم هذا المدرب إلى المستودع تلقائياً (إخلاء طرف آلي) قبل الحذف.</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-600 mb-6 text-center">
                            هل أنت متأكد من رغبتك في حذف هذا المدرب من النظام؟
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
                            إلغاء
                        </button>
                        <button type="button" onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm">
                            تأكيد الحذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
