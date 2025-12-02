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
import { Menu, Code, RefreshCw } from 'lucide-react';
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch,
  getDocs
} from 'firebase/firestore';

const App: React.FC = () => {
  // State initialization
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- FIREBASE SUBSCRIPTIONS ---
  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(data);
    });

    const unsubTrainers = onSnapshot(collection(db, "trainers"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer));
      setTrainers(data);
    });

    // Order transactions by time (newest first logic can be handled in UI, or here)
    // We get all to allow filtering in HistoryLog
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
  }, []);

  // --- DATA SEEDING (Run once if DB is empty) ---
  useEffect(() => {
    const seedDatabase = async () => {
      if (loading) return; // Wait for initial load

      // Check if collections are empty
      if (items.length === 0 && trainers.length === 0) {
        console.log("Seeding database...");
        const batch = writeBatch(db);

        // Seed Items
        INITIAL_ITEMS.forEach(item => {
          // Create a new doc ref for each item
          const docRef = doc(collection(db, "items"));
          batch.set(docRef, { ...item, id: docRef.id }); // Ensure ID matches
        });

        // Seed Trainers
        INITIAL_TRAINERS.forEach(trainer => {
          const docRef = doc(collection(db, "trainers"));
          batch.set(docRef, { ...trainer, id: docRef.id });
        });

        try {
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
  }, [loading]); // Run when loading completes

  // --- HANDLERS (Async with Firebase) ---

  const handleAddItem = (name: string, category: string): Item => {
    // Optimistic return, actual save is async
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
    // Check active loans
    const activeLoans = transactions.filter(t => t.trainerId === id && t.isActive);
    
    if (activeLoans.length > 0) {
        // Return all items
        const batch = writeBatch(db);
        
        activeLoans.forEach(t => {
            const tRef = doc(db, "transactions", t.id);
            batch.update(tRef, { 
                isActive: false, 
                returnTime: new Date().toISOString(), 
                returnRequested: false 
            });
            
            // Look up item and update status
            const item = items.find(i => i.id === t.itemId || i.name === t.itemName);
            if (item) {
                 // Note: Ideally store itemId reliably. 
                 // If ID match from FB is different from seeding logic, might need care.
                 // But assuming consistent IDs:
                 const iRef = doc(db, "items", t.itemId); 
                 // If t.itemId matches document ID. 
                 // Note: Seeding uses random doc IDs for new items, but initial ones?
                 // Seeding logic above sets doc ID. So t.itemId SHOULD be doc ID.
                 batch.update(iRef, { status: ItemStatus.AVAILABLE });
            }
        });
        
        await batch.commit();
    }

    // Delete trainer
    await deleteDoc(doc(db, "trainers", id));
  };

  const handleUpdateTrainerPassword = async (id: string, newPassword: string) => {
      await updateDoc(doc(db, "trainers", id), { password: newPassword });
  };

  const handleCheckout = async (itemId: string, trainerId: string) => {
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
      await updateDoc(doc(db, "transactions", transactionId), { returnRequested: true });
      alert("تم إرسال طلب الإرجاع بنجاح. يرجى انتظار موافقة أمين المستودع.");
  };

  const handleReturn = async (transactionId: string) => {
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
        // Ensure transaction.itemId is valid doc ID
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