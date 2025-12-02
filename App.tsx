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
import { Menu, Code, RefreshCw, AlertTriangle } from 'lucide-react';
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch
} from 'firebase/firestore';

const App: React.FC = () => {
  // State initialization
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  
  // Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- FIREBASE SUBSCRIPTIONS ---
  useEffect(() => {
    if (!db) {
      console.error("Firestore database is not initialized.");
      setDbError(true);
      setLoading(false);
      return;
    }

    try {
      const unsubItems = onSnapshot(collection(db, "items"), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(data);
      });

      const unsubTrainers = onSnapshot(collection(db, "trainers"), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer));
        setTrainers(data);
      });

      const unsubTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
        setLoading(false);
      });

      return () => {
        unsubItems();
        unsubTrainers();
        unsubTransactions();
      };
    } catch (err) {
      console.error("Error setting up Firebase listeners:", err);
      setDbError(true);
      setLoading(false);
    }
  }, []);

  // --- DATA SEEDING (Run once if DB is empty) ---
  useEffect(() => {
    const seedDatabase = async () => {
      if (loading || !db || dbError) return; 

      // Check if collections are empty
      if (items.length === 0 && trainers.length === 0) {
        console.log("Seeding database...");
        try {
          const batch = writeBatch(db);

          // Seed Items
          INITIAL_ITEMS.forEach(item => {
            const docRef = doc(collection(db, "items"));
            batch.set(docRef, { ...item, id: docRef.id });
          });

          // Seed Trainers
          INITIAL_TRAINERS.forEach(trainer => {
            const docRef = doc(collection(db, "trainers"));
            batch.set(docRef, { ...trainer, id: docRef.id });
          });

          await batch.commit();
          console.log("Database seeded successfully");
        } catch (e) {
          console.error("Error seeding database:", e);
        }
      }
    };

    if (!loading) {
      seedDatabase();
    }
  }, [loading, items.length, trainers.length, dbError]); 

  // --- HANDLERS (Async with Firebase) ---

  const handleAddItem = (name: string, category: string): Item => {
    if (!db) return { id: 'temp', name, category, status: ItemStatus.AVAILABLE };

    const newItemTemp = {
      id: "temp-" + Date.now(),
      name,
      category,
      status: ItemStatus.AVAILABLE
    };
    
    addDoc(collection(db, "items"), {
      name,
      category,
      status: ItemStatus.AVAILABLE
    }).then(() => {
        // Success
    }).catch(err => alert("Error adding item: " + err.message));

    return newItemTemp;
  };

  const handleAddTrainer = async (name: string) => {
    if (!db) return;
    try {
        await addDoc(collection(db, "trainers"), {
            name: name,
            password: '1234'
        });
    } catch (e) {
        alert("Error adding trainer");
    }
  };

  const handleDeleteTrainer = async (id: string) => {
    if (!db) return;

    // Check active loans
    const activeLoans = transactions.filter(t => t.trainerId === id && t.isActive);
    
    const batch = writeBatch(db);
    
    if (activeLoans.length > 0) {
        activeLoans.forEach(t => {
            const tRef = doc(db, "transactions", t.id);
            batch.update(tRef, { 
                isActive: false, 
                returnTime: new Date().toISOString(), 
                returnRequested: false 
            });
            
            // Check if items list contains this item and update it
            const item = items.find(i => i.id === t.itemId);
            if (item) {
                 const iRef = doc(db, "items", t.itemId); 
                 batch.update(iRef, { status: ItemStatus.AVAILABLE });
            }
        });
    }

    // Delete trainer
    const trainerRef = doc(db, "trainers", id);
    batch.delete(trainerRef);

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error deleting trainer:", error);
      alert("حدث خطأ أثناء حذف المدرب");
    }
  };

  const handleUpdateTrainerPassword = async (id: string, newPassword: string) => {
      if (!db) return;
      await updateDoc(doc(db, "trainers", id), { password: newPassword });
  };

  const handleCheckout = async (itemId: string, trainerId: string) => {
    if (!db) return;

    const item = items.find(i => i.id === itemId);
    const trainer = trainers.find(t => t.id === trainerId);

    if (!item || !trainer) return;

    try {
        const batch = writeBatch(db);
        
        // 1. Create Transaction
        const tRef = doc(collection(db, "transactions"));
        batch.set(tRef, {
            itemId: item.id,
            itemName: item.name,
            trainerId: trainer.id,
            trainerName: trainer.name,
            checkoutTime: new Date().toISOString(),
            isActive: true,
            returnRequested: false
        });

        // 2. Update Item Status
        const iRef = doc(db, "items", itemId);
        batch.update(iRef, { status: ItemStatus.CHECKED_OUT });

        await batch.commit();

        if (currentPage === 'checkout') {
            alert(`تم تسجيل خروج "${item.name}" للمدرب ${trainer.name} بنجاح`);
            setCurrentPage('dashboard');
        }
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء تسجيل العملية");
    }
  };

  const handleTrainerReturnRequest = async (transactionId: string) => {
      if (!db) return;
      await updateDoc(doc(db, "transactions", transactionId), { returnRequested: true });
      alert("تم إرسال طلب الإرجاع بنجاح. يرجى انتظار موافقة أمين المستودع.");
  };

  const handleReturn = async (transactionId: string) => {
    if (!db) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    try {
        const batch = writeBatch(db);

        // 1. Update Transaction
        const tRef = doc(db, "transactions", transactionId);
        batch.update(tRef, { 
            isActive: false, 
            returnTime: new Date().toISOString(), 
            returnRequested: false 
        });

        // 2. Update Item Status
        const iRef = doc(db, "items", transaction.itemId);
        batch.update(iRef, { status: ItemStatus.AVAILABLE });

        await batch.commit();

        alert(`تم تأكيد استلام "${transaction.itemName}" وإعادتها للمستودع.`);
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء الإرجاع");
    }
  };

  const handlePageChange = (page: PageView) => {
      setCurrentPage(page);
  };

  // --- RENDER STATES ---

  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-2">تعذر الاتصال بقاعدة البيانات</h1>
        <p className="text-slate-600 max-w-md">
          يرجى التحقق من اتصال الإنترنت، أو إعدادات جدار الحماية. إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4">
              <RefreshCw className="animate-spin text-blue-600" size={40} />
              <p>جاري الاتصال بقاعدة البيانات...</p>
          </div>
      );
  }

  // Render Page Content
  const renderContent = () => {
    const publicPages: PageView[] = ['trainer-portal'];

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