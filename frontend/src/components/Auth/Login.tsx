import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, TrendingUp, Shield, Users, Cross, Info } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  loading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, loading }) => {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string>('');
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('login.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('login.errors.passwordMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (validateForm()) {
      try {
        await onLogin(formData.email, formData.password);
      } catch (error: any) {
        setFormError(error.message || t('login.toastLoginError'));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      // No need to handle navigation here as it's handled by the AuthProvider
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setFormError(error.message || t('login.toastGoogleError'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12  pl-60 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                <Wallet className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black">{t('login.brandTitle')}</h1>
                <p className="text-xl text-blue-200 font-medium">{t('login.brandSubtitle')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 max-w-md">
            

            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-4">{t('login.heroTitle')}</h2>
              <p className="text-lg text-blue-200 leading-relaxed">{t('login.heroBody')}</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('login.featureInvestTitle')}</h3>
                  <p className="text-blue-200 text-sm">{t('login.featureInvestDesc')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('login.featureSecureTitle')}</h3>
                  <p className="text-blue-200 text-sm">{t('login.featureSecureDesc')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('login.featureUxTitle')}</h3>
                  <p className="text-blue-200 text-sm">{t('login.featureUxDesc')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                 <Info className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t('login.featureNoInfoTitle')}</h3>
                  <p className="text-blue-200 text-sm">{t('login.featureNoInfoDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('login.brandTitle')}</h1>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t('login.welcome')}</h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">{t('login.signInPrompt')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-2 font-medium">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-medium">{t('login.rememberMe')}</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  {t('login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-bold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t('login.submit')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    {t('login.or')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || loading}
                className="w-full bg-white dark:bg-slate-700 text-gray-800 dark:text-white py-3 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FcGoogle className="w-5 h-5" />
                    <span>{t('login.googleSignIn')}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {t('login.noAccount')}{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                >
                  {t('login.register')}
                </button>
              </p>
            </div>

            {formError && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-xl border  text-center text-red-600 border-red-400 dark:border-red-400/30">
                {/* <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"> */}
                {/* <div className="text-red-600 px-10 py-3 rounded relative" role="alert"> */}
                  <span className="block sm:inline">{formError}</span>
                {/* </div> */}
              </div>
            )}

            {/* Demo Credentials */}
            {/* <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/30">
              
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;