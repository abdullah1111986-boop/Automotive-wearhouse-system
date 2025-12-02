import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CheckoutForm } from './components/CheckoutForm';
import { ReturnForm } from './components/ReturnForm';
import { ActiveInventory } from './components/ActiveInventory';
import { TrainerLoans } from './components/TrainerLoans';
import { HistoryLog } from './components/HistoryLog';
import { TrainerPortal } from './components/TrainerPortal';
import { AdminLogin } from './components/AdminLogin';
import { Item, Trainer, Transaction, ItemStatus, PageView } from './types';
import { INITIAL_ITEMS, INITIAL_TRAINERS } from './constants';
import { Menu, Code, Download } from 'lucide-react';

const App: React.FC = () => {
  // State initialization with LocalStorage persistence
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Data State
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    const saved = localStorage.getItem('trainers');
    return saved ? JSON.parse(saved) : INITIAL_TRAINERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('trainers', JSON.stringify(trainers));
  }, [trainers]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- HANDLERS ---

  const handleAddItem = async (name: string, category: string): Promise<Item> => {
    const newItem: Item = {
      id: `i-${Date.now()}`,
      name,
      category,
      status: ItemStatus.AVAILABLE
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  };

  const handleAddTrainer = (name: string) => {
    const newTrainer: Trainer = {
      id: `t-${Date.now()}`,
      name,
      password: '1234'
    };
    setTrainers(prev => [...prev, newTrainer]);
  };

  const handleDeleteTrainer = (id: string) => {
    // 1. Return all active loans for this trainer automatically
    const activeLoans = transactions.filter(t => t.trainerId === id && t.isActive);
    
    if (activeLoans.length > 0) {
        setTransactions(prev => prev.map(t => {
            if (t.trainerId === id && t.isActive) {
                return { ...t, isActive: false, returnTime: new Date().toISOString() };
            }
            return t;
        }));

        setItems(prevItems => prevItems.map(item => {
            const wasLoaned = activeLoans.find(l => l.itemId === item.id);
            if (wasLoaned) {
                return { ...item, status: ItemStatus.AVAILABLE };
            }
            return item;
        }));
    }

    // 2. Delete Trainer
    setTrainers(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTrainerPassword = (id: string, newPassword: string) => {
      setTrainers(prev => prev.map(t => 
          t.id === id ? { ...t, password: newPassword } : t
      ));
  };

  const handleCheckout = (itemId: string, trainerId: string) => {
    const item = items.find(i => i.id === itemId);
    const trainer = trainers.find(t => t.id === trainerId);

    if (item && trainer) {
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        trainerId: trainer.id,
        trainerName: trainer.name,
        checkoutTime: new Date().toISOString(),
        isActive: true,
        returnRequested: false
      };

      setTransactions(prev => [...prev, newTransaction]);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: ItemStatus.CHECKED_OUT } : i));

      if (currentPage === 'checkout') {
          alert(`تم تسجيل خروج "${item.name}" للمدرب ${trainer.name} بنجاح`);
          setCurrentPage('dashboard');
      }
    }
  };

  const handleTrainerReturnRequest = (transactionId: string) => {
      setTransactions(prev => prev.map(t => 
          t.id === transactionId ? { ...t, returnRequested: true } : t
      ));
      alert("تم إرسال طلب الإرجاع بنجاح. يرجى انتظار موافقة أمين المستودع.");
  };

  const handleReturn = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
        ? { ...t, isActive: false, returnTime: new Date().toISOString(), returnRequested: false } 
        : t
      ));

      setItems(prev => prev.map(i => i.id === transaction.itemId ? { ...i, status: ItemStatus.AVAILABLE } : i));
      
      alert(`تم تأكيد استلام "${transaction.itemName}" وإعادتها للمستودع.`);
    }
  };

  const handleExportData = () => {
    const data = {
        items,
        trainers,
        transactions,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_inventory_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page: PageView) => {
      setCurrentPage(page);
  };

  // Render Page Content
  const renderContent = () => {
    const publicPages: PageView[] = ['trainer-portal'];

    if (!publicPages.includes(currentPage) && !isAdminUnlocked) {
        return <AdminLogin onLoginSuccess={() => setIsAdminUnlocked(true)} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
            <div className="space-y-6">
                <Dashboard transactions={transactions} items={items} />
                
                {/* Backup Button for Admin */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-8 flex justify-between items-center no-print">
                    <div>
                        <h3 className="font-bold text-slate-700">نسخة احتياطية</h3>
                        <p className="text-xs text-slate-500">تحميل نسخة كاملة من البيانات (المدربين، المعدات، السجلات)</p>
                    </div>
                    <button 
                        onClick={handleExportData}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700"
                    >
                        <Download size={16} />
                        تصدير البيانات
                    </button>
                </div>
            </div>
        );
      case 'checkout':
        return (
          <CheckoutForm 
            items={items} 
            trainers={trainers} 
            transactions={transactions}
            onCheckout={handleCheckout} 
            onAddItem={handleAddItem}
          />
        );
      case 'return':
        return <ReturnForm transactions={transactions} onReturn={handleReturn} />;
      case 'inventory':
        return <ActiveInventory transactions={transactions} />;
      case 'trainer-view':
        return (
          <TrainerLoans 
            transactions={transactions} 
            trainers={trainers} 
            onAddTrainer={handleAddTrainer}
            onDeleteTrainer={handleDeleteTrainer}
            onUpdatePassword={handleUpdateTrainerPassword}
          />
        );
      case 'trainer-portal':
        return (
            <TrainerPortal 
                trainers={trainers}
                items={items}
                transactions={transactions}
                onCheckout={handleCheckout}
                onRequestReturn={handleTrainerReturnRequest}
                onAddItem={handleAddItem}
                onUpdatePassword={handleUpdateTrainerPassword}
            />
        );
      case 'history':
        return <HistoryLog transactions={transactions} />;
      default:
        return <AdminLogin onLoginSuccess={() => setIsAdminUnlocked(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setPage={handlePageChange} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:mr-64 transition-all duration-300 flex flex-col min-h-screen">
        {/* Header Mobile */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
           <span className="font-bold">نظام العهد</span>
           <button onClick={() => setIsSidebarOpen(true)}>
             <Menu />
           </button>
        </div>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
           {renderContent()}
        </main>
        
        {/* Global Footer */}
        <footer className="mt-auto py-6 text-center text-slate-500 text-xs md:text-sm border-t border-slate-200 bg-slate-100 no-print">
            <div className="container mx-auto px-4">
                <p className="flex items-center justify-center gap-1 font-bold text-blue-800 mb-1">
                    <Code size={14} />
                    برمجة وتطوير: م. عبدالله الزهراني
                </p>
                <p className="text-slate-400">جميع الحقوق محفوظة © {new Date().getFullYear()} - قسم التقنية الميكانيكية</p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;