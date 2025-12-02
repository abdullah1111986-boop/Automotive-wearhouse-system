import React, { useState } from 'react';
import { Item, Trainer, Transaction, ItemStatus } from '../types';
import { User, ArrowUpRight, ArrowLeft, Clock, CheckCircle, Plus, X, Save, Wrench, Lock, Settings, LogOut, AlertTriangle } from 'lucide-react';

interface TrainerPortalProps {
  trainers: Trainer[];
  items: Item[];
  transactions: Transaction[];
  onCheckout: (itemId: string, trainerId: string) => void;
  onRequestReturn: (transactionId: string) => void;
  onAddItem: (name: string, category: string) => Promise<Item>;
  onUpdatePassword: (id: string, newPass: string) => void;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({ 
  trainers, 
  items, 
  transactions, 
  onCheckout, 
  onRequestReturn,
  onAddItem,
  onUpdatePassword
}) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTrainerId, setCurrentTrainerId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Portal State
  const [activeTab, setActiveTab] = useState<'checkout' | 'my-items' | 'settings'>('checkout');
  
  // Checkout State
  const [checkoutSearch, setCheckoutSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  // Add Manual Item State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings State
  const [newPassword, setNewPassword] = useState('');

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [transactionToReturn, setTransactionToReturn] = useState<Transaction | null>(null);

  // Derived Data
  const currentTrainer = trainers.find(t => t.id === currentTrainerId);
  const myActiveTransactions = transactions.filter(t => t.isActive && t.trainerId === currentTrainerId);
  
  const availableItems = items.filter(
      i => i.status === ItemStatus.AVAILABLE && 
      i.name.toLowerCase().includes(checkoutSearch.toLowerCase())
  );

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trainer = trainers.find(t => t.id === currentTrainerId);
    
    if (!trainer) {
        setLoginError('الرجاء اختيار اسم المدرب من القائمة');
        return;
    }

    // Strict Password Validation
    // Remove whitespace to prevent errors
    const inputPass = loginPassword.trim();
    const storedPass = trainer.password?.trim() || '';

    if (!inputPass) {
        setLoginError('الرجاء إدخال الرقم السري');
        return;
    }

    if (storedPass === inputPass) {
        setIsAuthenticated(true);
        setLoginError('');
    } else {
        setLoginError('كلمة المرور غير صحيحة');
        setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentTrainerId('');
      setLoginPassword('');
      setLoginError('');
      setActiveTab('checkout');
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if(newPassword.length < 4) {
          alert("كلمة المرور يجب أن تكون 4 أرقام/حروف على الأقل");
          return;
      }
      if(currentTrainerId) {
          onUpdatePassword(currentTrainerId, newPassword);
          setNewPassword('');
          alert("تم تغيير كلمة المرور بنجاح ✅");
      }
  };

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) return;
    setIsSubmitting(true);
    
    try {
        const category = newItemCategory.trim() || 'عام';
        const addedItem = await onAddItem(newItemName, category);
        
        // Reset add form
        setIsAddingNew(false);
        setNewItemName('');
        setNewItemCategory('');
        
        // Select the newly added item automatically
        setSelectedItem(addedItem.id);
    } catch (e) {
        console.error(e);
        alert('حدث خطأ');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSelfCheckout = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent any default form submission
      
      if (currentTrainerId && selectedItem) {
          const item = items.find(i => i.id === selectedItem);
          if (!item) return;

          // Direct execution: No window.confirm to avoid blocking issues on mobile/touch devices
          onCheckout(selectedItem, currentTrainerId);
          setSelectedItem('');
          setCheckoutSearch('');
          
          // Show success message slightly after state updates to ensure smooth UI
          setTimeout(() => alert(`تم استلام "${item.name}" بنجاح ✅`), 50);
      }
  };

  const initiateReturnRequest = (transaction: Transaction) => {
      setTransactionToReturn(transaction);
      setShowReturnModal(true);
  };

  const confirmReturnRequest = () => {
      if (transactionToReturn) {
          onRequestReturn(transactionToReturn.id);
          setShowReturnModal(false);
          setTransactionToReturn(null);
      }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
        <div className="max-w-md mx-auto mt-10 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} className="text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">بوابة المدربين</h2>
                <p className="text-slate-500 mb-6 text-sm">سجل دخولك لإدارة عهدك وتقديم طلبات الإرجاع</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="text-right">
                        <label className="block text-sm font-medium text-slate-700 mb-2">اسم المدرب</label>
                        <select 
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                            onChange={(e) => {
                                setCurrentTrainerId(e.target.value);
                                setLoginError('');
                                setLoginPassword(''); // Reset password when changing user
                            }}
                            value={currentTrainerId}
                        >
                            <option value="">-- اختر الاسم --</option>
                            {trainers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-right">
                         <label className="block text-sm font-medium text-slate-700 mb-2">الرقم السري</label>
                         <div className="relative">
                            <input 
                                type="password"
                                value={loginPassword}
                                onChange={(e) => {
                                    setLoginPassword(e.target.value);
                                    setLoginError('');
                                }}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="أدخل الرقم السري"
                            />
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                         </div>
                    </div>

                    {loginError && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {loginError}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
                    >
                        دخول
                    </button>
                </form>
            </div>
        </div>
    );
  }

  // --- RENDER: PORTAL INTERFACE ---
  return (
    <div className="space-y-6 animate-fade-in relative">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xl">
                    {currentTrainer?.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">مرحباً، {currentTrainer?.name}</h2>
                    <p className="text-sm text-slate-500">لديك {myActiveTransactions.length} عهدة مسجلة باسمك</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 border border-red-100 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
                <LogOut size={16} />
                تسجيل خروج
            </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-lg overflow-x-auto">
            <button 
                onClick={() => setActiveTab('checkout')}
                className={`flex-1 py-2 px-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === 'checkout' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ArrowUpRight size={16} />
                استلام عدة
            </button>
            <button 
                onClick={() => setActiveTab('my-items')}
                className={`flex-1 py-2 px-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === 'my-items' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ArrowLeft size={16} />
                عهدتي ({myActiveTransactions.length})
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 px-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 min-w-[120px] ${activeTab === 'settings' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Settings size={16} />
                الإعدادات
            </button>
        </div>

        {/* Content */}
        {activeTab === 'checkout' ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                        <Wrench size={20} />
                        استلام عدة من المستودع
                    </h3>
                    
                    {!isAddingNew && (
                        <button 
                            type="button"
                            onClick={() => setIsAddingNew(true)}
                            className="text-xs bg-amber-50 text-amber-600 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1 font-bold"
                        >
                            <Plus size={14} />
                            إضافة معدة يدوياً
                        </button>
                    )}
                </div>

                {isAddingNew ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-amber-200 animate-fade-in mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-800">إضافة معدة جديدة وتسجيلها</h4>
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="التصنيف (مثلاً: عدد يدوية، كهرباء)"
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddNewItem}
                                    disabled={!newItemName || isSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 rounded text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {isSubmitting ? 'جاري...' : 'حفظ وتحديد'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <input 
                            type="text"
                            placeholder="بحث في المعدات المتاحة..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-2 focus:ring-2 focus:ring-amber-500 outline-none"
                            value={checkoutSearch}
                            onChange={(e) => setCheckoutSearch(e.target.value)}
                        />
                        <select
                            value={selectedItem}
                            onChange={(e) => setSelectedItem(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        >
                            <option value="">-- اختر المعدة / الجهاز --</option>
                            {availableItems.length === 0 ? (
                                <option disabled>لا توجد نتائج مطابقة</option>
                            ) : (
                                availableItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.category})
                                    </option>
                                ))
                            )}
                        </select>
                        
                        <div className="text-right text-xs text-slate-500 mb-4">
                            {availableItems.length} معدة متاحة
                        </div>

                        <button 
                            type="button"
                            onClick={handleSelfCheckout}
                            disabled={!selectedItem}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <ArrowUpRight size={18} />
                            تأكيد الاستلام
                        </button>
                    </>
                )}
            </div>
        ) : activeTab === 'settings' ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    <Settings size={20} />
                    تغيير الرقم السري
                </h3>
                <div className="max-w-md">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">الرقم السري الجديد</label>
                            <input 
                                type="text" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="أدخل الرقم الجديد"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">يجب أن يكون الرقم سهل الحفظ بالنسبة لك</p>
                        </div>
                        <button 
                            type="submit"
                            disabled={!newPassword}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                            حفظ التغييرات
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            في حال نسيان الرقم السري، يرجى التواصل مع المشرف (م. عبدالله الزهراني) أو أمين المستودع (م. علي الشمري) لإعادة تعيينه.
                        </p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                <h3 className="font-bold text-lg mb-4 text-slate-700">العهد المسجلة باسمي</h3>
                {myActiveTransactions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                        <p className="text-slate-600 font-medium">ذمتك خالية!</p>
                        <p className="text-slate-400 text-sm">لا توجد أي معدات مسجلة باسمك حالياً</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myActiveTransactions.map(t => (
                            <div key={t.id} className={`border p-4 rounded-lg flex justify-between items-center ${t.returnRequested ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                <div>
                                    <p className="font-bold text-slate-800">{t.itemName}</p>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                        <Clock size={12} />
                                        <span>تاريخ الاستلام: {new Date(t.checkoutTime).toLocaleDateString('ar-SA')}</span>
                                    </div>
                                    {t.returnRequested && (
                                        <span className="inline-block mt-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded font-bold">
                                            بانتظار موافقة الأمين
                                        </span>
                                    )}
                                </div>
                                
                                {!t.returnRequested ? (
                                    <button 
                                        onClick={() => initiateReturnRequest(t)}
                                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs px-4 py-2 rounded-md font-bold transition-colors shadow-sm"
                                    >
                                        طلب إرجاع
                                    </button>
                                ) : (
                                    <div className="text-amber-500 animate-pulse">
                                        <Clock size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Return Request Confirmation Modal */}
        {showReturnModal && transactionToReturn && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="bg-amber-50 p-6 text-center border-b border-amber-100">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-800 mb-2">تأكيد طلب الإرجاع</h3>
                        <p className="text-slate-600 text-sm">
                            هل أنت متأكد من رغبتك في إرجاع: <br/>
                            <span className="font-bold text-slate-800">{transactionToReturn.itemName}</span>؟
                        </p>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-xs text-slate-400 mb-6 text-center">
                            ملاحظة: لن يتم إخلاء طرفك من العهدة إلا بعد موافقة أمين المستودع على هذا الطلب.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowReturnModal(false)} 
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                type="button" 
                                onClick={confirmReturnRequest} 
                                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm transition-colors"
                            >
                                نعم، إرسال الطلب
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};