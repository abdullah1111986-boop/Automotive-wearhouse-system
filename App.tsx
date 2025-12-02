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
import { Menu, Code } from 'lucide-react';

const App: React.FC = () => {
  // State initialization
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Data State (Simulating database)
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('inventory_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    const saved = localStorage.getItem('inventory_trainers');
    // We prioritize saved data to allow persistence of changes (password updates, deletions)
    // If no saved data exists, we load the initial hardcoded list.
    if (saved) {
        return JSON.parse(saved);
    }
    return INITIAL_TRAINERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('inventory_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist data
  useEffect(() => {
    localStorage.setItem('inventory_items', JSON.stringify(items));
    localStorage.setItem('inventory_transactions', JSON.stringify(transactions));
    localStorage.setItem('inventory_trainers', JSON.stringify(trainers));
  }, [items, transactions, trainers]);

  // Handlers
  const handleAddItem = (name: string, category: string): Item => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      name,
      category,
      status: ItemStatus.AVAILABLE
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  };

  const handleAddTrainer = (name: string) => {
    const newTrainer: Trainer = {
      id: crypto.randomUUID(),
      name: name,
      password: '1234' // Default password for new manually added trainers
    };
    setTrainers(prev => [...prev, newTrainer]);
  };

  const handleDeleteTrainer = (id: string) => {
    // Check if trainer has items first
    const hasItems = transactions.some(t => t.trainerId === id && t.isActive);
    
    if (hasItems) {
        // Auto-return all items for this trainer
        setTransactions(prev => prev.map(t => 
             (t.trainerId === id && t.isActive)
             ? { ...t, isActive: false, returnTime: new Date().toISOString(), returnRequested: false }
             : t
        ));
        
        // Update items status back to available
        const trainerTransactions = transactions.filter(t => t.trainerId === id && t.isActive);
        const itemIdsToReturn = trainerTransactions.map(t => t.itemId);
        
        setItems(prev => prev.map(i => 
            itemIdsToReturn.includes(i.id) ? { ...i, status: ItemStatus.AVAILABLE } : i
        ));
    }

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

    if (!item || !trainer) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      trainerId: trainer.id,
      trainerName: trainer.name,
      checkoutTime: new Date().toISOString(),
      isActive: true,
      returnRequested: false
    };

    // Update Transaction Log
    setTransactions(prev => [...prev, newTransaction]);

    // Update Item Status
    setItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, status: ItemStatus.CHECKED_OUT } : i
    ));
    
    // Only redirect if done by admin (not from portal)
    if (currentPage === 'checkout') {
        alert(`تم تسجيل خروج "${item.name}" للمدرب ${trainer.name} بنجاح`);
        setCurrentPage('dashboard');
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
    if (!transaction) return;

    // Update Transaction
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { ...t, isActive: false, returnTime: new Date().toISOString(), returnRequested: false } 
        : t
    ));

    // Update Item Status
    setItems(prev => prev.map(i => 
      i.id === transaction.itemId ? { ...i, status: ItemStatus.AVAILABLE } : i
    ));

    alert(`تم تأكيد استلام "${transaction.itemName}" وإعادتها للمستودع.`);
  };

  const handlePageChange = (page: PageView) => {
      setCurrentPage(page);
  };

  // Render Page Content
  const renderContent = () => {
    // Define pages that are OPEN to everyone (no admin login required)
    // Only 'trainer-portal' is public now. 'history' requires admin login.
    const publicPages: PageView[] = ['trainer-portal'];

    // If page is NOT public and admin is NOT unlocked, show Admin Login
    // This protects: dashboard, checkout, return, inventory, trainer-view, history
    if (!publicPages.includes(currentPage) && !isAdminUnlocked) {
        return <AdminLogin onLoginSuccess={() => setIsAdminUnlocked(true)} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard transactions={transactions} items={items} />;
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
        // Default fallthrough to dashboard which is protected
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