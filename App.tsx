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
import { Menu, Code, Download, WifiOff } from 'lucide-react';
import { db } from './services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const App: React.FC = () => {
  // State initialization
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(true);

  // --- FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!db) {
        setIsDbConnected(false);
        return;
    }

    // 1. Items Subscription
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(data);
        
        // Seeding Initial Items if empty
        if (data.length === 0) {
            seedItems();
        }
    }, (error) => {
        console.error("Error fetching items:", error);
        setIsDbConnected(false);
    });

    // 2. Trainers Subscription
    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer));
        setTrainers(data);

        // Seeding Initial Trainers if empty
        if (data.length === 0) {
            seedTrainers();
        }
    });

    // 3. Transactions Subscription
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
    });

    return () => {
        unsubItems();
        unsubTrainers();
        unsubTransactions();
    };
  }, []);

  // --- SEEDING FUNCTIONS ---
  const seedItems = async () => {
      if (!db) return;
      const batch = writeBatch(db);
      INITIAL_ITEMS.forEach(item => {
          // Create a new ref for each item (letting Firestore generate ID, or use predefined if needed)
          const docRef = doc(collection(db, 'items'));
          // We remove the hardcoded ID to let Firestore generate one, or we can use it.
          // Let's use Firestore IDs for cleaner DB, but map properties
          batch.set(docRef, { 
              name: item.name, 
              category: item.category, 
              status: item.status 
          });
      });
      await batch.commit();
      console.log("Items seeded");
  };

  const seedTrainers = async () => {
      if (!db) return;
      const batch = writeBatch(db);
      INITIAL_TRAINERS.forEach(trainer => {
          const docRef = doc(collection(db, 'trainers'));
          batch.set(docRef, {
              name: trainer.name,
              password: trainer.password
          });
      });
      await batch.commit();
      console.log("Trainers seeded");
  };

  // --- HANDLERS ---

  const handleAddItem = async (name: string, category: string): Promise<Item> => {
    if (!db) throw new Error("Database not connected");
    
    const newItem = {
      name,
      category,
      status: ItemStatus.AVAILABLE
    };
    
    const docRef = await addDoc(collection(db, 'items'), newItem);
    return { id: docRef.id, ...newItem };
  };

  const handleAddTrainer = async (name: string) => {
    if (!db) return;
    const newTrainer = {
      name,
      password: '1234'
    };
    await addDoc(collection(db, 'trainers'), newTrainer);
  };

  const handleDeleteTrainer = async (id: string) => {
    if (!db) return;

    // 1. Return all active loans for this trainer
    const activeLoans = transactions.filter(t => t.trainerId === id && t.isActive);
    
    const batch = writeBatch(db);

    if (activeLoans.length > 0) {
      // Return items to inventory
      activeLoans.forEach(loan => {
          // Find the item to update status
          const item = items.find(i => i.id === loan.itemId);
          if (item) { // Check if item exists in current state
             // Note: In a real app we might want to query the item doc ref directly or store doc ID reference accurately
             // Here we assume items state is in sync. 
             // IMPORTANT: We need the DOCUMENT ID from Firestore, which comes from snapshot.
             // Our state 'items' has 'id' which IS the document ID because of the mapping in onSnapshot.
             const itemRef = doc(db, 'items', loan.itemId);
             batch.update(itemRef, { status: ItemStatus.AVAILABLE });
          }

          // Close transaction
          const txRef = doc(db, 'transactions', loan.id);
          batch.update(txRef, { isActive: false, returnTime: new Date().toISOString() });
      });
    }

    // 2. Delete Trainer
    const trainerRef = doc(db, 'trainers', id);
    batch.delete(trainerRef);

    await batch.commit();
  };

  const handleUpdateTrainerPassword = async (id: string, newPassword: string) => {
      if (!db) return;
      const trainerRef = doc(db, 'trainers', id);
      await updateDoc(trainerRef, { password: newPassword });
  };

  const handleCheckout = async (itemId: string, trainerId: string) => {
    if (!db) return;
    const item = items.find(i => i.id === itemId);
    const trainer = trainers.find(t => t.id === trainerId);

    if (item && trainer) {
      const batch = writeBatch(db);

      // Create Transaction
      const newTransactionRef = doc(collection(db, 'transactions'));
      const newTransaction = {
        itemId: item.id,
        itemName: item.name,
        trainerId: trainer.id,
        trainerName: trainer.name,
        checkoutTime: new Date().toISOString(),
        isActive: true,
        returnRequested: false
      };
      batch.set(newTransactionRef, newTransaction);

      // Update Item Status
      const itemRef = doc(db, 'items', itemId);
      batch.update(itemRef, { status: ItemStatus.CHECKED_OUT });

      await batch.commit();

      if (currentPage === 'checkout') {
          alert(`تم تسجيل خروج "${item.name}" للمدرب ${trainer.name} بنجاح`);
          setCurrentPage('dashboard');
      }
    }
  };

  const handleTrainerReturnRequest = async (transactionId: string) => {
      if (!db) return;
      const txRef = doc(db, 'transactions', transactionId);
      await updateDoc(txRef, { returnRequested: true });
      alert("تم إرسال طلب الإرجاع بنجاح. يرجى انتظار موافقة أمين المستودع.");
  };

  const handleReturn = async (transactionId: string) => {
    if (!db) return;
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      const batch = writeBatch(db);

      // Close Transaction
      const txRef = doc(db, 'transactions', transactionId);
      batch.update(txRef, { 
          isActive: false, 
          returnTime: new Date().toISOString(), 
          returnRequested: false 
      });

      // Update Item Status
      const itemRef = doc(db, 'items', transaction.itemId);
      batch.update(itemRef, { status: ItemStatus.AVAILABLE });
      
      await batch.commit();
      
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
    if (!isDbConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-red-50 rounded-xl border border-red-200">
                <WifiOff size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">فشل الاتصال بقاعدة البيانات</h2>
                <p className="text-red-600 max-w-md">
                    يرجى التحقق من الاتصال بالإنترنت. إذا استمرت المشكلة، قد يكون هناك خطأ في إعدادات Firebase.
                </p>
                <p className="text-sm text-red-400 mt-4 font-mono bg-white px-3 py-1 rounded border border-red-100">
                    Project ID: automotive-wearhouse
                </p>
            </div>
        );
    }

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