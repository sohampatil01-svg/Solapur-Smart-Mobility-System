import React, { useState } from 'react';
import { Shield, Lock, User, ChevronDown, Cpu, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('Traffic Police');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsScanning(true);
        setError('');

        // Simulate "Scanning" animation
        setTimeout(() => {
            if (username.trim() === 'admin' && password.trim() === 'admin123') {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userDept', department);
                window.location.href = '/';
            } else {
                setIsScanning(false);
                setError('⚠️ ACCESS DENIED: Invalid Credentials');
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
        }, 2000);
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
            
            {/* Background Cyberpunk Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-950 to-slate-950"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                
                {/* Animated Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* Glassmorphism Card */}
            <div className={`relative z-10 w-full max-w-md px-4 transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                    
                    {/* Glowing Accents */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        {/* Logo & Header */}
                        <div className="flex flex-col items-center mb-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 border border-white/20">
                                <Shield className="text-white w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter text-white">
                                SOLAPUR <span className="text-cyan-400">SMART MOBILITY</span>
                            </h1>
                            <p className="text-slate-400 text-xs font-mono mt-1 uppercase tracking-widest">Central Command Authorization</p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Terminal ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-400 text-slate-500">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10"
                                        placeholder="Enter administrator ID..."
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Secure Passkey</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-400 text-slate-500">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Department Dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department</label>
                                <div className="relative">
                                    <select 
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3.5 px-4 text-white outline-none appearance-none transition-all focus:border-cyan-500/50 cursor-pointer"
                                    >
                                        <option value="Traffic Police">Traffic Police Control</option>
                                        <option value="System Admin">System Administrator</option>
                                        <option value="Emergency Response">Emergency Response</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                                    <AlertCircle className="text-rose-500 shrink-0" size={18} />
                                    <p className="text-rose-500 text-xs font-bold tracking-tight">{error}</p>
                                </div>
                            )}

                            {/* Login Button */}
                            <button 
                                type="submit" 
                                disabled={isScanning}
                                className={`w-full group relative overflow-hidden py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-500 ${isScanning ? 'bg-slate-800' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.5)] active:scale-[0.98]'}`}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2 text-white">
                                    {isScanning ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Scanning Biometrics...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Cpu size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                                            <span>Initialize Login</span>
                                        </>
                                    )}
                                </div>
                                {isScanning && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse opacity-20"></div>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
                                Secure Terminal Access Point // Solapur SMC v4.0.2
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}} />
        </div>
    );
};

export default LoginPage;
