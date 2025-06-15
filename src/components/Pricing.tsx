import React from 'react';
import { Check, Star, Zap, Shield, Users, BarChart3, MessageSquare, Crown } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface PricingProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const Pricing: React.FC<PricingProps> = ({ language, onLanguageChange, onNavigate }) => {
  const text = {
    ar: {
      title: 'اختر الخطة المناسبة لشركتك',
      subtitle: 'خطط مرنة تناسب جميع أحجام الشركات العقارية',
      freePlan: 'مجاني',
      proPlan: 'احترافي',
      freePrice: '٠ جنيه',
      proPrice: '٢٩٩ جنيه / شهريًا',
      subscribeNow: 'اشترك الآن',
      getStarted: 'ابدأ مجاناً',
      mostPopular: 'الأكثر شعبية',
      freeFeatures: [
        'ملف شركة أساسي',
        'عرض التقييمات',
        'إحصائيات أساسية',
        'دعم عبر البريد الإلكتروني'
      ],
      proFeatures: [
        'جميع مميزات الخطة المجانية',
        'الرد على التقييمات',
        'إحصائيات متقدمة',
        'تحليلات مفصلة',
        'دعم أولوية',
        'شعار مخصص',
        'إدارة متعددة المستخدمين',
        'تقارير شهرية'
      ],
      faq: 'الأسئلة الشائعة',
      faqItems: [
        {
          question: 'هل يمكنني تغيير خطتي في أي وقت؟',
          answer: 'نعم، يمكنك ترقية أو تخفيض خطتك في أي وقت. التغييرات ستطبق فوراً وسيتم تعديل الفاتورة تبعاً لذلك.'
        },
        {
          question: 'ما هي طرق الدفع المتاحة؟',
          answer: 'نقبل جميع البطاقات الائتمانية الرئيسية، التحويل البنكي، والدفع عبر فودافون كاش وأورانج موني.'
        },
        {
          question: 'هل هناك رسوم إضافية؟',
          answer: 'لا، جميع الأسعار شاملة ولا توجد رسوم خفية. ما تراه هو ما تدفعه.'
        },
        {
          question: 'هل يمكنني إلغاء اشتراكي في أي وقت؟',
          answer: 'نعم، يمكنك إلغاء اشتراكك في أي وقت دون أي التزامات. ستحتفظ بالوصول حتى نهاية فترة الفوترة الحالية.'
        }
      ]
    },
    en: {
      title: 'Choose the Plan That\'s Right for Your Business',
      subtitle: 'Flexible plans suitable for real estate companies of all sizes',
      freePlan: 'Free',
      proPlan: 'Pro',
      freePrice: '£0',
      proPrice: '£299 / month',
      subscribeNow: 'Subscribe Now',
      getStarted: 'Get Started',
      mostPopular: 'Most Popular',
      freeFeatures: [
        'Basic company profile',
        'View reviews',
        'Basic statistics',
        'Email support'
      ],
      proFeatures: [
        'All free plan features',
        'Reply to reviews',
        'Advanced analytics',
        'Detailed insights',
        'Priority support',
        'Custom branding',
        'Multi-user management',
        'Monthly reports'
      ],
      faq: 'Frequently Asked Questions',
      faqItems: [
        {
          question: 'Can I change my plan at any time?',
          answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be applied immediately and billing will be adjusted accordingly.'
        },
        {
          question: 'What payment methods are available?',
          answer: 'We accept all major credit cards, bank transfers, and mobile payments via Vodafone Cash and Orange Money.'
        },
        {
          question: 'Are there any additional fees?',
          answer: 'No, all prices are inclusive and there are no hidden fees. What you see is what you pay.'
        },
        {
          question: 'Can I cancel my subscription at any time?',
          answer: 'Yes, you can cancel your subscription at any time with no commitments. You\'ll retain access until the end of your current billing period.'
        }
      ]
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-8 hover-lift">
              <Crown className="h-10 w-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark-500 mb-6 leading-tight animate-fade-in">
              {text[language].title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up max-w-3xl mx-auto">
              {text[language].subtitle}
            </p>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover-lift transition-all duration-300 hover:border-gray-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-2xl mx-auto mb-6">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-dark-500 mb-2">
                  {text[language].freePlan}
                </h3>
                <div className="text-4xl font-bold text-dark-500 mb-4">
                  {text[language].freePrice}
                </div>
                <p className="text-gray-600">
                  {language === 'ar' ? 'للشركات الناشئة' : 'For startups'}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {text[language].freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full btn-secondary border-2 border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-500 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300">
                {text[language].getStarted}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-primary-500 p-8 hover-lift transition-all duration-300 relative overflow-hidden">
              {/* Most Popular Badge */}
              <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-bl-xl rtl:rounded-br-xl rtl:rounded-bl-none font-semibold text-sm">
                {text[language].mostPopular}
              </div>

              <div className="text-center mb-8 mt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-dark-500 mb-2">
                  {text[language].proPlan}
                </h3>
                <div className="text-4xl font-bold text-primary-500 mb-4">
                  {text[language].proPrice}
                </div>
                <p className="text-gray-600">
                  {language === 'ar' ? 'للشركات المتنامية' : 'For growing companies'}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {text[language].proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full btn-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover-lift transition-all duration-300 flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <Zap className="h-5 w-5" />
                <span>{text[language].subscribeNow}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-500 mb-4">
              {language === 'ar' ? 'مقارنة المميزات' : 'Feature Comparison'}
            </h2>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Analytics Feature */}
            <div className="bg-white rounded-xl p-8 text-center hover-lift shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-2xl mx-auto mb-6">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'احصل على رؤى مفصلة حول أداء شركتك وتقييمات العملاء'
                  : 'Get detailed insights into your company performance and customer reviews'
                }
              </p>
            </div>

            {/* Reply Feature */}
            <div className="bg-white rounded-xl p-8 text-center hover-lift shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-2xl mx-auto mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'الرد على التقييمات' : 'Reply to Reviews'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'تفاعل مع عملائك من خلال الرد على تقييماتهم وبناء الثقة'
                  : 'Engage with your customers by responding to their reviews and building trust'
                }
              </p>
            </div>

            {/* Support Feature */}
            <div className="bg-white rounded-xl p-8 text-center hover-lift shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-2xl mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'دعم أولوية' : 'Priority Support'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'احصل على دعم سريع ومخصص من فريقنا المتخصص'
                  : 'Get fast and dedicated support from our specialized team'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-500 mb-4">
              {text[language].faq}
            </h2>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6">
            {text[language].faqItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover-lift transition-all duration-300 hover:bg-gray-100">
                <h3 className="text-xl font-bold text-dark-500 mb-4">
                  {item.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-accent-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            {language === 'ar' 
              ? 'انضم إلى مئات الشركات العقارية التي تثق في منصتنا لإدارة سمعتها الرقمية'
              : 'Join hundreds of real estate companies that trust our platform to manage their digital reputation'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-300">
              {text[language].getStarted}
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-500 px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-300">
              {text[language].subscribeNow}
            </button>
          </div>
        </div>
      </section>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default Pricing;