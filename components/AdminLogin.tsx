import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_PHONES = ['0558882711', '0500187164']; // Supervisor and Storekeeper phones

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_PHONES.includes(password.trim())) {
      onLoginSuccess();
      setError('');
    } else {
      setError('رمز المرور غير صحيح. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center">
        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-slate-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">الدخول مقيد</h2>
        <p className="text-slate-500 mb-8 text-sm">هذه الصفحة خاصة بالمشرف وأمين المستودع فقط.<br/>الرجاء إدخال الرقم السري للمتابعة.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
             <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل الرقم السري"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-center tracking-widest text-lg"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm justify-center">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            تسجيل الدخول <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};