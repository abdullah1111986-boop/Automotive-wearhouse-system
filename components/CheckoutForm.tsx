import React, { useState } from 'react';
import { Item, Trainer, ItemStatus, Transaction } from '../types';
import { Wrench, User, ArrowRight, Plus, X, Save, History, Briefcase } from 'lucide-react';

interface CheckoutFormProps {
  items: Item[];
  trainers: Trainer[];
  transactions: Transaction[];
  onCheckout: (itemId: string, trainerId: string) => void;
  onAddItem: (name: string, category: string) => Item;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ items, trainers, transactions, onCheckout, onAddItem }) => {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [filterText, setFilterText] = useState('');

  // New Item State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const availableItems = items.filter(
    i => i.status === ItemStatus.AVAILABLE && 
    i.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Calculate Counters
  const trainerLoanCount = transactions.filter(t => t.isActive && t.trainerId === selectedTrainer).length;
  const itemUsageCount = transactions.filter(t => t.itemId === selectedItem).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && selectedTrainer) {
      onCheckout(selectedItem, selectedTrainer);
      setSelectedItem('');
      setSelectedTrainer('');
      setFilterText('');
    }
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    
    const category = newItemCategory.trim() || 'عام';
    const addedItem = onAddItem(newItemName, category);
    
    // Reset add form
    setIsAddingNew(false);
    setNewItemName('');
    setNewItemCategory('');
    
    // Select the newly added item automatically
    setSelectedItem(addedItem.id);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <ArrowRight size={20} />
        </span>
        تسجيل خروج عدة (تسليم)
      </h2>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
        
        {/* Item Selection Section */}
        <div className="border-b border-slate-100 pb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Wrench size={16} />
              اختر المعدة / الجهاز
            </label>
            
            {!isAddingNew && (
              <button 
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                إضافة معدة يدوياً
              </button>
            )}
          </div>

          {isAddingNew ? (
            <div className="bg-slate-50 p-4 rounded-lg border border-blue-200 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-800">بيانات المعدة الجديدة</h4>
                <button 
                  type="button" 
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <input 
                    type="text"
                    placeholder="اسم المعدة أو الجهاز"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="التصنيف (مثلاً: عدد يدوية، كهرباء)"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button 
                    type="button"
                    onClick={handleAddNewItem}
                    disabled={!newItemName}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save size={14} />
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <input 
                type="text"
                placeholder="بحث عن معدة..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full mb-2 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="">اختر المعدة / الجهاز...</option>
                {availableItems.length === 0 ? (
                    <option disabled>لا توجد معدات متاحة مطابقة للبحث</option>
                ) : (
                    availableItems.map(item => (
                    <option key={item.id} value={item.id} className="py-1">
                        {item.name} - {item.category}
                    </option>
                    ))
                )}
              </select>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500">
                  {availableItems.length} معدة متاحة حالياً
                </p>
                {selectedItem && (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                        <History size={12} />
                        تم صرف هذه المعدة {itemUsageCount} مرة سابقاً
                    </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Trainer Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <User size={16} />
            اسم المدرب المستلم
          </label>
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            required
          >
            <option value="">اختر المدرب...</option>
            {trainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
          
          {selectedTrainer && (
             <div className="mt-2 text-right">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-bold ${trainerLoanCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    <Briefcase size={12} />
                    {trainerLoanCount > 0 ? `في حوزته حالياً ${trainerLoanCount} عهدة` : 'لا توجد لديه عهد حالياً'}
                </span>
             </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedItem || !selectedTrainer}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <span>تسجيل العملية</span>
          {selectedTrainer && trainerLoanCount > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  (لديه {trainerLoanCount} حالياً)
              </span>
          )}
        </button>

      </form>
    </div>
  );
};