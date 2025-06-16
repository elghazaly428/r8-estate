import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Home, Grid3X3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface SignUpProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const text = {
    ar: {
      createAccount: 'إنشاء حساب جديد',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      createAccountBtn: 'إنشاء حساب',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      login: 'سجل الدخول',
      home: 'الرئيسية',
      categories: 'الفئات',
      loginBtn: 'تسجيل الدخول',
      signupBtn: 'إنشاء حساب',
      creating: 'جاري إنشاء الحساب...',
      successMessage: 'تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      fillAllFields: 'يرجى ملء جميع الحقول',
      userAlreadyExists: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.'
    },
    en: {
      createAccount: 'Create a New Account',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      createAccountBtn: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      login: 'Log in',
      home: 'Home',
      categories: 'Categories',
      loginBtn: 'Log in',
      signupBtn: 'Sign up',
      creating: 'Creating account...',
      successMessage: 'Success! Please check your email for a confirmation link.',
      passwordMismatch: 'Passwords do not match',
      fillAllFields: 'Please fill in all fields',
      userAlreadyExists: 'This email is already registered. Please log in instead.'
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent default form submission behavior
    if (isLoading) return;

    // Validate form data
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error(text[language].fillAllFields);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(text[language].passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Execute Supabase Authentication signUp function
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw authError;
      }

      // Step 2: Check if signUp was successful and returned a valid user object
      if (authData.user) {
        // Step 3: Insert into profiles table with user ID from signUp
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          throw profileError;
        }

        // Success message
        toast.success(text[language].successMessage);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('User creation failed - no user object returned');
      }
    } catch (error: any) {
      // Handle specific error cases
      console.error('Sign up error:', error);
      
      // Check for user already exists error
      if (error.message === 'User already registered' || error.code === 'user_already_exists') {
        toast.error(text[language].userAlreadyExists);
      } else {
        // Display generic error message for other errors
        toast.error(`Error: ${error.message || 'An unexpected error occurred'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Right side */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 rtl:space-x-reverse hover:opacity-80 transition-opacity duration-200"
            >
              <img 
                src="/Picture1.png" 
                alt="R8 ESTATE" 
                className="h-10 w-auto"
              />
              <div className="text-xl font-bold">
                <span className="text-accent-500">R8</span>
                <span className="text-primary-500">ESTATE</span>
              </div>
            </button>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
              <button 
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
              >
                <Home className="h-4 w-4" />
                <span>{text[language].home}</span>
              </button>
              <button 
                onClick={() => onNavigate('categories')}
                className="flex items-center space-x-2 rtl:space-x-reverse text-dark-500 hover:text-primary-500 font-medium transition-colors duration-200"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>{text[language].categories}</span>
              </button>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button 
                onClick={() => onNavigate('login')}
                className="btn-secondary text-dark-500 hover:text-primary-500 px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                {text[language].loginBtn}
              </button>
              <button className="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                {text[language].signupBtn}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-dark-500 mb-2">
              {text[language].createAccount}
            </h1>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].firstName}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder={text[language].firstName}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].lastName}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder={text[language].lastName}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    disabled={isLoading}
                  />
                </div>
              </div>

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
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].confirmPassword}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
                    <Lock className="h-5 w-5 text-gray-400 mr-2 rtl:ml-2 rtl:mr-0" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 pr-16 rtl:pl-16 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder={text[language].confirmPassword}
                    dir="ltr"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? text[language].creating : text[language].createAccountBtn}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {text[language].alreadyHaveAccount}{' '}
                <button 
                  onClick={() => onNavigate('login')}
                  className="text-primary-500 hover:text-primary-600 font-semibold transition-colors duration-200"
                  disabled={isLoading}
                >
                  {text[language].login}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;