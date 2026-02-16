"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.setItem("auth", "true");
        router.push("/admin");
      } else {
        alert("Неверный пароль");
        setIsLoading(false);
      }
    } catch (error) {
      alert("Ошибка при входе");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 transition-colors duration-700">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-black/[0.05] dark:from-white/[0.02] dark:to-white/[0.05] pointer-events-none" />
      
      {/* Декоративные элементы */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-black/[0.02] dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      
      <div className={`
        w-full max-w-md relative
        transition-all duration-1000 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* Карточка входа */}
        <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-white/5 p-8 sm:p-10">
          
          {/* Заголовок */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-black/5 dark:bg-white/5 animate-float">
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 text-black/40 dark:text-white/40" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-black/80 dark:text-white/80 mb-2">
              Вход в панель
            </h1>
            <p className="text-sm sm:text-base text-black/40 dark:text-white/40 font-light">
              Введите пароль для доступа к управлению
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={login} className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-black/50 dark:text-white/50 font-light">
                Пароль
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-xl outline-none transition-all duration-300 text-black/80 dark:text-white/80 font-light text-sm sm:text-base placeholder:text-black/30 dark:placeholder:text-white/30"
                  placeholder="••••••••"
                  autoFocus
                  disabled={isLoading}
                />
                <div className="absolute inset-0 rounded-xl border border-black/10 dark:border-white/10 pointer-events-none group-hover:border-black/20 dark:group-hover:border-white/20 transition-colors duration-300" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className={`
                w-full px-6 py-3 sm:py-4 
                bg-black/80 dark:bg-white/80 
                hover:bg-black dark:hover:bg-white 
                text-white dark:text-black 
                rounded-xl font-light 
                transition-all duration-500 ease-out 
                disabled:opacity-40 disabled:cursor-not-allowed 
                transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center justify-center gap-2
                text-sm sm:text-base
                relative overflow-hidden group
              `}
            >
              {/* Эффект при наведении */}
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border border-white/30 dark:border-black/30 border-t-white dark:border-t-black transition-all duration-700" />
                  <span className="relative">Вход...</span>
                </>
              ) : (
                <>
                  <span className="relative">Войти</span>
                  <svg 
                    className="w-4 h-4 relative transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Дополнительная информация */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-black/10 dark:border-white/10 text-center">
            <p className="text-[10px] sm:text-xs text-black/30 dark:text-white/30 font-light">
              Доступ только для авторизованных пользователей
            </p>
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-[10px] sm:text-xs text-black/30 dark:text-white/30 font-light animate-pulse">
            © {new Date().getFullYear()} · Панель управления
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}