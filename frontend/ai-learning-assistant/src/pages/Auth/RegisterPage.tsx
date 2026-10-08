import {useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import authService from '../../services/authService';
import {BrainCircuit, Mail, Lock, ArrowRight, User} from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterPage(props) {
    const [username,setUsername] = useState('');
    const [email,setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(password.trim().length < 6) {
            setError('Password must be at least 6 characters long');
        }

        setError('');
        setLoading(true);
        try {
            await authService.register(username, email, password);
            toast.success("Registered in successfully! Please login!");
            navigate('/login');
        } catch (error) {
            setError(error.message || "Failed to register. Please try again.");
            toast.error(error.message ||"Failed to Register");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-500">

            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30"></div>

            <div className="relative w-full max-w-md px-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-10">

                    {/*Headers*/}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500  shadow-lg shadow-emerald-500/25 mb-6">
                            <BrainCircuit className="w-7 h-7 text-white" strokeWidth={2} />
                        </div>
                        <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">Create an account</h1>
                        <p className="text-slate-500 text-sm">Start your AI-powered learning experience</p>
                    </div>

                    {/*Form*/}
                    <div className="space-y-5">
                        {/* Username field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercae tracking-wide" htmlFor="username">Username</label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 
                                ${focusedField === 'username' ?'text-emerald-500': 'text-slate-400'}`}>
                                    <User className="h-5 w-5" strokeWidth={2} />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={(e) => setFocusedField(null)}
                                    className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:-bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="Your Username"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text font-semibold text-slate-700 uppercase tracking-wide" htmlFor="email">Email</label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200
                                    ${focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    <Mail className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    id="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={(e) => setFocusedField('email')}
                                    onBlur={(e) => setFocusedField(null)}
                                    className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:-bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text font-semibold text-slate-700 uppercase tracking-wide" htmlFor="password">Password</label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200
                                ${focusedField === "password" ? "text-emerald-500" : "text-slate-400"}`}>
                                    <Lock className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={(e) => setFocusedField("password")}
                                    onBlur={(e) => setFocusedField(null)}
                                    className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:-bg-white focus:shadow-lg focus:shadow-emerald-500/10"
                                    placeholder="password"
                                />
                            </div>
                        </div>

                        {/* Error Messages*/}
                        {error && (<div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                <p className="text-xs text-red-600 font-medium text-center">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="group relative cursor-pointer w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-500/25 overflow-hidden">
                            <span className="relative z-20 flex items-center justify-center gap-2">
                                {loading ? (<>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin">
                                    </div>
                                    Creating account...
                                </>) : (
                                    <>
                                        Create account
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2.5} />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 -translte-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-200/60">
                        <p className="text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link to={'/login'} className='font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200'>
                                Sign in
                            </Link>
                        </p>
                    </div>

                </div>
                {/* Subtle footer text */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    By continuing, you agree to our Terms & Privacy Policy
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;