import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';

interface ContactProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const Contact: React.FC<ContactProps> = ({ language, onLanguageChange, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const text = {
    ar: {
      title: 'تواصل معنا',
      subtitle: 'نحن هنا لمساعدتك. تواصل معنا عبر البريد الإلكتروني على info@r8estate.com أو استخدم النموذج أدناه.',
      contactInfo: 'معلومات الاتصال',
      getInTouch: 'ابق على تواصل',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      subject: 'الموضوع',
      message: 'الرسالة',
      sendMessage: 'إرسال الرسالة',
      namePlaceholder: 'اكتب اسمك الكامل',
      emailPlaceholder: 'اكتب بريدك الإلكتروني',
      subjectPlaceholder: 'اكتب موضوع رسالتك',
      messagePlaceholder: 'اكتب رسالتك هنا...',
      emailAddress: 'info@r8estate.com',
      phoneNumber: '+20 123 456 7890',
      address: 'القاهرة، مصر',
      businessHours: 'ساعات العمل',
      workingHours: 'الأحد - الخميس: 9:00 ص - 6:00 م',
      responseTime: 'وقت الاستجابة',
      responseTimeText: 'نرد عادة خلال 24 ساعة',
      messageSent: 'شكراً لك! تم إرسال رسالتك.'
    },
    en: {
      title: 'Contact Us',
      subtitle: 'We\'re here to help you. For inquiries, please email us at info@r8estate.com or use the form below.',
      contactInfo: 'Contact Information',
      getInTouch: 'Get in Touch',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      sendMessage: 'Send Message',
      namePlaceholder: 'Enter your full name',
      emailPlaceholder: 'Enter your email address',
      subjectPlaceholder: 'Enter your message subject',
      messagePlaceholder: 'Write your message here...',
      emailAddress: 'info@r8estate.com',
      phoneNumber: '+20 123 456 7890',
      address: 'Cairo, Egypt',
      businessHours: 'Business Hours',
      workingHours: 'Sunday - Thursday: 9:00 AM - 6:00 PM',
      responseTime: 'Response Time',
      responseTimeText: 'We usually respond within 24 hours',
      messageSent: 'Thank you! Your message has been sent.'
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a placeholder - no actual functionality
    toast.success(text[language].messageSent);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-8 hover-lift">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark-500 mb-6 leading-tight animate-fade-in">
              {text[language].title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up max-w-3xl mx-auto leading-relaxed">
              {text[language].subtitle}
            </p>
            <div className="w-24 h-1 bg-accent-500 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-dark-500 mb-6 flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-accent-500" />
                  </div>
                  <span>{text[language].contactInfo}</span>
                </h2>
                <div className="w-16 h-1 bg-accent-500 rounded-full mb-8"></div>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 rtl:space-x-reverse p-6 bg-gray-50 rounded-xl hover-lift">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-accent-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-500 mb-1">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                    </h3>
                    <p className="text-gray-600">{text[language].emailAddress}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 rtl:space-x-reverse p-6 bg-gray-50 rounded-xl hover-lift">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-500 mb-1">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </h3>
                    <p className="text-gray-600">{text[language].phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 rtl:space-x-reverse p-6 bg-gray-50 rounded-xl hover-lift">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-500 mb-1">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </h3>
                    <p className="text-gray-600">{text[language].address}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    ⏰
                  </div>
                  <h3 className="font-bold text-dark-500 mb-2">
                    {text[language].businessHours}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {text[language].workingHours}
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-xl text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    ⚡
                  </div>
                  <h3 className="font-bold text-dark-500 mb-2">
                    {text[language].responseTime}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {text[language].responseTimeText}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-dark-500 mb-6 flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Send className="h-4 w-4 text-primary-500" />
                </div>
                <span>{text[language].getInTouch}</span>
              </h2>
              <div className="w-16 h-1 bg-primary-500 rounded-full mb-8"></div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].name}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={text[language].namePlaceholder}
                      className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={text[language].emailPlaceholder}
                      className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].subject}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder={text[language].subjectPlaceholder}
                      className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      required
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-dark-500 mb-2">
                    {text[language].message}
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder={text[language].messagePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-vertical"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full btn-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover-lift transition-all duration-300 flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Send className="h-5 w-5" />
                  <span>{text[language].sendMessage}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default Contact;