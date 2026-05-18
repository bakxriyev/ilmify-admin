'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Phone, Lock, GraduationCap, AlertCircle, Shield, Users, BookOpen, Eye, EyeOff, CheckCircle, Sparkles } from 'lucide-react';
import { adminApi } from '@/api/adminApi';

export default function LoginPage() {
  const router = useRouter();
  
  // State'lar
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<'admin'>('admin');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number, size: number, speed: number}>>([]);

  // Particle effect yaratish
  useEffect(() => {
    setMounted(true);
    
    // Create floating particles
    const newParticles = Array.from({ length: 15 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.2
    }));
    setParticles(newParticles);

    return () => setMounted(false);
  }, []);

  // Dastlabgi tekshirish - agar token bo'lsa, dashboardga yo'naltirish
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        const admin = localStorage.getItem('admin');
        const teacher = localStorage.getItem('teacher');
        
        if (token && admin) {
          const adminData = JSON.parse(admin);
          if (adminData?.role === 'super_admin') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('admin');
            router.push('/super-admin/login');
          } else {
            router.push('/dashboard');
          }
        } else if (token && teacher) {
          router.push('/teachers');
        }
      }
    };
    
    checkAuth();
  }, [router]);

  // Telefon raqamini formatlash funksiyasi
  const formatPhoneNumber = (input: string): string => {
    let digits = input.replace(/\D/g, '');
    
    if (digits.startsWith('998')) {
      digits = digits.substring(3);
    }
    
    digits = digits.substring(0, 9);
    
    if (digits.length > 5) {
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7)}`;
    } else if (digits.length > 2) {
      return `${digits.substring(0, 2)} ${digits.substring(2)}`;
    }
    
    return digits;
  };

  // Telefon raqamini backend formatiga o'tkazish
  const preparePhoneForBackend = (input: string): string => {
    let digits = input.replace(/\D/g, '');
    
    if (digits.length === 9) {
      return `+998${digits}`;
    }
    
    if (digits.length === 12 && digits.startsWith('998')) {
      return `+${digits}`;
    }
    
    if (input.startsWith('+998')) {
      return input;
    }
    
    return `+998${digits.substring(digits.length - 9)}`;
  };

  // Telefon input o'zgarganda
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    setError(null);
  };

  // Login formani yuborish
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setError('Iltimos, telefon raqamini kiriting');
      return;
    }
    
    if (!password.trim()) {
      setError('Iltimos, parolni kiriting');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Telefon raqami noto\'g\'ri formatda');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formattedPhone = preparePhoneForBackend(phone);
      
      {
        const response = await adminApi.login({
          phone_number: formattedPhone,
          password
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('admin', JSON.stringify(response.admin));
          localStorage.removeItem('teacher');
        }

        if (rememberMe) {
          localStorage.setItem('rememberedPhone', phone);
        } else {
          localStorage.removeItem('rememberedPhone');
        }

        setTimeout(() => {
          const adminData = response.admin as any;
          if (adminData?.role === 'super_admin') {
            router.push('/super-admin');
          } else {
            router.push('/dashboard');
          }
        }, 800);
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Kirish muvaffaqiyatsiz. Iltimos, qayta urinib ko\'ring.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        localStorage.removeItem('teacher');
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Saqlangan telefon raqamini yuklash
  useEffect(() => {
    const rememberedPhone = localStorage.getItem('rememberedPhone');
    if (rememberedPhone) {
      setPhone(rememberedPhone);
      setRememberMe(true);
    }
  }, []);

  // Enter tugmasi bilan login qilish
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        handleLogin(e as any);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [loading, phone, password]);

  // Loading komponenti
  if (loading && !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <p className="text-white text-lg mt-4 animate-pulse">Kirish amalga oshirilmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-200/10 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${particle.speed * 20 + 10}s`
            }}
          />
        ))}
      </div>

      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        
        <div className={`flex items-center space-x-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <GraduationCap className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white animate-gradient bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              BAHRIYEV
            </h1>
            <p className="text-blue-100 text-sm">Learning School</p>
          </div>
        </div>

        <div className={`max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 hover:bg-white/20 transition-all duration-300 group">
              <Shield className="w-5 h-5 text-white mr-2 group-hover:rotate-12 transition-transform" />
              <span className="text-white text-sm font-medium">Admin Panel</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Welcome to <span className="text-blue-200 animate-pulse-slow">Admin Panel</span>
            </h2>
            <p className="text-blue-100 text-lg mb-10">
              Manage students, teachers, courses, and track learning progress efficiently.
            </p>
          </div>

          <div className="space-y-8">
            <div className={`flex items-start space-x-4 group hover:bg-white/5 p-3 rounded-xl transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
                <Users className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Manage Students & Teachers</h3>
                <p className="text-blue-100 text-sm">Add, edit, and manage user accounts efficiently</p>
              </div>
            </div>

            <div className={`flex items-start space-x-4 group hover:bg-white/5 p-3 rounded-xl transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
                <BookOpen className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Track Learning Progress</h3>
                <p className="text-blue-100 text-sm">Monitor student performance and course completion</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`text-blue-100 text-sm transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>
          <p>© 2026 BAHRIYEV Learning School. All rights reserved.</p>
          <p className="mt-1 text-blue-200">Version 2.0 • Admin Panel</p>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 right-10 w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-float-slow blur-xl"></div>
        <div className="absolute bottom-1/4 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-float-slower blur-xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center p-8 sm:p-12 md:p-16 relative">
        <div className="w-full max-w-md mx-auto">
          <div className={`lg:hidden flex items-center justify-center mb-10 animate-slide-down ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <GraduationCap className="w-9 h-9 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BAHRIYEV</h1>
              <p className="text-blue-600 font-medium">Learning School Admin</p>
            </div>
          </div>

          <div className={`mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 animate-gradient bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 bg-clip-text text-transparent">
              Admin Panelga Kirish
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Admin hisob ma'lumotlaringizni kiriting
            </p>
          </div>

          <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} overflow-hidden group`}>
            {/* Card shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            <CardContent className="p-8 relative z-10">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-shake border-red-300 bg-red-50">
                    <AlertCircle className="h-4 w-4 animate-pulse" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                <input type="hidden" value="admin" />

                <div className="space-y-6">
                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '100ms' }}>
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-blue-600" />
                      Telefon Raqami *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="pl-12 h-14 text-lg relative bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                        placeholder="90 123 45 67"
                        disabled={loading}
                        required
                        autoComplete="tel"
                        aria-label="Telefon raqami"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <span className="text-gray-400 font-medium">+998</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      +998 kodsiz kiriting (masalan: 90 123 45 67)
                    </p>
                  </div>

                  <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-blue-600" />
                        Parol *
                      </label>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        className="pl-12 pr-12 h-14 text-lg relative bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                        placeholder="••••••••"
                        disabled={loading}
                        required
                        autoComplete="current-password"
                        aria-label="Parol"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '300ms' }}>
                    <div className="relative">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                        disabled={loading}
                      />
                      <div 
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          rememberMe 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        {rememberMe && (
                          <svg className="w-4 h-4 text-white animate-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Eslab qolish
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-14 text-lg font-semibold relative overflow-hidden group transition-all duration-500 ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: '400ms' }}
                  disabled={loading || !phone.trim() || !password.trim()}
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-blue-700 group-hover:to-cyan-600 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-600 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Kirish...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                        Tizimga Kirish
                      </>
                    )}
                  </span>
                </Button>

                <div className={`text-center mt-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
                  <div className="inline-flex items-center text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 rounded-xl border border-gray-100 shadow-sm group">
                    <div className="relative">
                      <Shield className="w-5 h-5 text-green-500 mr-2 animate-pulse" />
                      <div className="absolute inset-0 w-5 h-5 bg-green-500/20 rounded-full animate-ping"></div>
                    </div>
                    <span className="font-medium">Xavfsiz kirish • SSL shifrlangan</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className={`mt-8 text-center text-sm text-gray-600 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>
            <p>© 2026 BAHRIYEV Learning School. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-500">Admin Panel v2.0 • Secure Access Only</p>
          </div>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(20px) translateX(-30px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes check {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 10s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-check {
          animation: check 0.2s ease-out;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #1e40af);
        }
      `}</style>
    </div>
  );
}