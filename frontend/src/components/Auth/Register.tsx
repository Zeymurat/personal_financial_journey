import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Wallet, Check } from 'lucide-react';

interface RegisterProps {
  onRegister: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin, loading }) => {
  const { t } = useTranslation('auth');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formError, setFormError] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('register.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('register.errors.nameMin');
    }
    
    if (!formData.email) {
      newErrors.email = t('register.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('register.errors.passwordMin');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('register.errors.passwordPattern');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmMismatch');
    }
    
    if (!acceptTerms) {
      newErrors.terms = t('register.errors.termsRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!acceptTerms) {
      setFormError(t('register.formAcceptTerms'));
      return;
    }
    
    if (validateForm()) {
      try {
        await onRegister(formData.name, formData.email, formData.password);
      } catch (error: any) {
        setFormError(error.message || t('register.toastRegisterError'));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    return strength;
  };

  const getStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return t('register.passwordStrength.weak');
    if (strength <= 3) return t('register.passwordStrength.medium');
    return t('register.passwordStrength.strong');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 pl-60 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-2xl">
                <Wallet className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black">{t('login.brandTitle')}</h1>
                <p className="text-xl text-purple-200 font-medium">{t('register.brandSubtitle')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 max-w-md">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-4">{t('register.heroTitle')}</h2>
              <p className="text-lg text-purple-200 leading-relaxed">{t('register.heroBody')}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-purple-200">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-semibold">{t('register.bullet1')}</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-200">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-semibold">{t('register.bullet2')}</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-200">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-semibold">Aylık raporlar ve grafikler</span>
              </div>
              <div className="flex items-center space-x-3 text-purple-200">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-semibold">{t('register.bullet4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
            <div className="text-center">
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('login.brandTitle')}</h1>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('register.title')}</h2>
              <p className="text-gray-300 mb-4">{t('register.subtitle')}</p>
              {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{formError}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('register.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${
                      errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder={t('register.namePlaceholder')}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-2 font-medium">{errors.name}</p>}
              </div>

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
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${
                      errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
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
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${
                      errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
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
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${(getPasswordStrength() / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {getStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-sm mt-2 font-medium">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-2 font-medium">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                    className="mt-1 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                  />
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {t('register.termsCheckboxLabel')}
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-sm mt-2 font-medium">{errors.terms}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-bold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t('register.submit')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {t('register.hasAccount')}{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
                >
                  {t('register.signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;