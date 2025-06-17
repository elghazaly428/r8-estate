import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

interface LoginProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const text = {
    ar: {
      loginToAccount: 'تسجيل الدخول',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      loginBtn: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      signUp: 'أنشئ حساب جديد',
      backToHome: 'العودة للرئيسية',
      loggingIn: 'جاري تسجيل الدخول...',
      fillAllFields: 'يرجى ملء جميع الحقول',
      loginSuccess: 'تم تسجيل الدخول بنجاح!',
      emailNotConfirmed: 'لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك والنقر على رابط التأكيد المرسل إليك.',
      resendConfirmation: 'إعادة إرسال رسالة التأكيد',
      resendingConfirmation: 'جاري إعادة الإرسال...',
      confirmationResent: 'تم إعادة إرسال رسالة التأكيد. يرجى التحقق من صندوق الوارد الخاص بك.',
      resendFailed: 'فشل في إعادة إرسال رسالة التأكيد. يرجى المحاولة مرة أخرى.'
    },
    en: {
      loginToAccount: 'Log in to your account',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      loginBtn: 'Log In',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      backToHome: 'Back to Home',
      loggingIn: 'Logging in...',
      fillAllFields: 'Please fill in all fields',
      loginSuccess: 'Login successful!',
      emailNotConfirmed: 'Email not confirmed. Please check your inbox and click the confirmation link sent to you.',
      resendConfirmation: 'Resend confirmation email',
      resendingConfirmation: 'Resending...',
      confirmationResent: 'Confirmation email has been resent. Please check your inbox.',
      resendFailed: 'Failed to resend confirmation email. Please try again.'
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error(text[language].fillAllFields);
      return;
    }

    setIsResendingConfirmation(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });

      if (error) {
        throw error;
      }

      toast.success(text[language].confirmationResent);
      setShowResendOption(false);
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      toast.error(text[language].resendFailed);
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent default form submission behavior
    if (isLoading) return;

    // Validate form data
    if (!formData.email || !formData.password) {
      toast.error(text[language].fillAllFields);
      return;
    }

    setIsLoading(true);
    setShowResendOption(false);

    try {
      // Execute Supabase Authentication signInWithPassword function
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // If login fails, display error message
        throw error;
      }

      // If login is successful, show success message and redirect to homepage
      if (data.user) {
        toast.success(text[language].loginSuccess);
        onNavigate('home');
      }
    } catch (error: any) {
      // Display error message to user
      console.error('Login error:', error);
      
      // Check for specific email confirmation error
      if (error.message && (error.message.includes('Email not confirmed') || error.code === 'email_not_confirmed')) {
        toast.error(text[language].emailNotConfirmed);
        setShowResendOption(true);
      } else {
        const errorMessage = error.message || 'An unexpected error occurred';
        toast.error(`Login failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Use the main Header component */}
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center space-x-2 rtl:space-x-reverse text-primary-500 hover:text-primary-600 transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{text[language].backToHome}</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-dark-500 mb-2">
              {text[language].loginToAccount}
            </h1>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].email}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder={text[language].email}
                    dir="ltr"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                    <Lock className="h-5 w-5 text-gray-400 mr-2 rtl:ml-2 rtl:mr-0" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 pr-16 rtl:pl-16 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder={text[language].password}
                    dir="ltr"
                    disabled={isLoading}
                  />
                </div>
                
                {/* Forgot Password Link */}
                <div className="mt-2 text-right rtl:text-left">
                  <button 
                    type="button"
                    className="text-sm text-primary-500 hover:text-primary-600 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {text[language].forgotPassword}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? text[language].loggingIn : text[language].loginBtn}
              </button>

              {/* Resend Confirmation Email Button */}
              {showResendOption && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResendingConfirmation || !formData.email}
                  className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${isResendingConfirmation ? 'animate-spin' : ''}`} />
                  <span>
                    {isResendingConfirmation ? text[language].resendingConfirmation : text[language].resendConfirmation}
                  </span>
                </button>
              )}
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {text[language].noAccount}{' '}
                <button 
                  onClick={() => onNavigate('signup')}
                  className="text-primary-500 hover:text-primary-600 font-semibold transition-colors duration-200"
                  disabled={isLoading}
                >
                  {text[language].signUp}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default Login;