'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, CreditCard, Lock, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [chairmanNationalId, setChairmanNationalId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!username || !chairmanNationalId || !newPassword || !confirmPassword) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          chairmanNationalId,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการกู้คืนรหัสผ่าน');
      }

      setSuccessMsg(result.message || 'รีเซ็ตรหัสผ่านสำเร็จ!');
      
      Swal.fire({
        icon: 'success',
        title: 'ตั้งรหัสผ่านใหม่สำเร็จ',
        text: 'คุณสามารถใช้รหัสผ่านใหม่ในการลงชื่อเข้าใช้ได้ทันที',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#6366f1',
      }).then(() => {
        router.push('/login');
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 min-h-screen p-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/50 relative z-10">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/login')}
          className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>กลับหน้าล็อกอิน</span>
        </button>

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white text-center">
            กู้คืนรหัสผ่าน / ตั้งค่ารหัสผ่านใหม่
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 text-center font-light leading-5">
            ยืนยันรหัสศูนย์คู่กับเลขบัตรประชาชนของประธานคณะทำงาน<br/>
            เพื่อสร้างรหัสผ่านใหม่ทดแทนรหัสเดิม
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs mb-6 animate-pulse">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs mb-6">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ชื่อผู้ใช้งาน (Username) หรือรหัสศูนย์
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="เช่น KRI011301 หรือ U-0002"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              เลขบัตรประชาชนประธานคณะทำงาน
            </label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                maxLength={17}
                placeholder="กรอกเฉพาะตัวเลข 13 หลัก"
                value={chairmanNationalId}
                onChange={(e) => setChairmanNationalId(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-t border-slate-800/40 my-4" />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              รหัสผ่านใหม่ (New Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ยืนยันรหัสผ่านใหม่ (Confirm New Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>กำลังดำเนินการกู้รหัสผ่าน...</span>
              </>
            ) : (
              <span>ยืนยันตั้งรหัสผ่านใหม่</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
