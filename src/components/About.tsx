import React from 'react';
import { Users, Target, Award, Heart } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface AboutProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

const About: React.FC<AboutProps> = ({ language, onLanguageChange, onNavigate }) => {
  const text = {
    ar: {
      mission: 'مهمتنا: تعزيز الشفافية للقطاع العقاري',
      ourStory: 'قصتنا',
      ourTeam: 'فريقنا',
      storyParagraph1: 'تأسست R8 ESTATE في عام 2024 برؤية واضحة: جعل سوق العقارات في مصر أكثر شفافية وموثوقية. لاحظنا أن العملاء يواجهون صعوبة في العثور على معلومات موثوقة حول الشركات العقارية، مما يجعل اتخاذ القرارات الاستثمارية أمراً صعباً ومحفوفاً بالمخاطر.',
      storyParagraph2: 'من خلال منصتنا المبتكرة، نوفر للعملاء إمكانية قراءة التقييمات الحقيقية من عملاء سابقين، مما يساعدهم على اتخاذ قرارات مدروسة. كما نمكن الشركات من التفاعل مع عملائها والرد على استفساراتهم، مما يخلق بيئة من الثقة المتبادلة.',
      storyParagraph3: 'نؤمن بأن الشفافية هي أساس النجاح في أي سوق، ونسعى لأن نكون الجسر الذي يربط بين العملاء والشركات العقارية الموثوقة في مصر. هدفنا هو بناء مجتمع عقاري قائم على الثقة والجودة.',
      ceoTitle: 'الرئيس التنفيذي والمؤسس',
      ctoTitle: 'مدير التكنولوجيا',
      cmoTitle: 'مدير التسويق',
      headOfOperationsTitle: 'رئيس العمليات'
    },
    en: {
      mission: 'Our Mission: To Enhance Transparency for the Real Estate Sector',
      ourStory: 'Our Story',
      ourTeam: 'Our Team',
      storyParagraph1: 'R8 ESTATE was founded in 2024 with a clear vision: to make the real estate market in Egypt more transparent and trustworthy. We noticed that customers faced difficulty finding reliable information about real estate companies, making investment decisions challenging and risky.',
      storyParagraph2: 'Through our innovative platform, we provide customers with the ability to read genuine reviews from previous clients, helping them make informed decisions. We also enable companies to interact with their customers and respond to their inquiries, creating an environment of mutual trust.',
      storyParagraph3: 'We believe that transparency is the foundation of success in any market, and we strive to be the bridge that connects customers with trusted real estate companies in Egypt. Our goal is to build a real estate community based on trust and quality.',
      ceoTitle: 'CEO & Founder',
      ctoTitle: 'Chief Technology Officer',
      cmoTitle: 'Chief Marketing Officer',
      headOfOperationsTitle: 'Head of Operations'
    }
  };

  const teamMembers = [
    {
      name: { ar: 'أحمد محمد علي', en: 'Ahmed Mohamed Ali' },
      title: text[language].ceoTitle,
      image: '👨‍💼'
    },
    {
      name: { ar: 'فاطمة حسن إبراهيم', en: 'Fatima Hassan Ibrahim' },
      title: text[language].ctoTitle,
      image: '👩‍💻'
    },
    {
      name: { ar: 'محمد أحمد السيد', en: 'Mohamed Ahmed El-Sayed' },
      title: text[language].cmoTitle,
      image: '👨‍💼'
    },
    {
      name: { ar: 'سارة عبد الرحمن', en: 'Sara Abdel Rahman' },
      title: text[language].headOfOperationsTitle,
      image: '👩‍💼'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-8 hover-lift">
              <Target className="h-10 w-10" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark-500 mb-6 leading-tight animate-fade-in">
              {text[language].mission}
            </h1>
            <div className="w-24 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse mb-6">
              <Heart className="h-8 w-8 text-accent-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-dark-500">
                {text[language].ourStory}
              </h2>
            </div>
            <div className="w-16 h-1 bg-accent-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-8 hover-lift">
              <p className="text-lg leading-relaxed text-gray-700 text-center">
                {text[language].storyParagraph1}
              </p>
            </div>

            <div className="bg-primary-50 rounded-xl p-8 hover-lift">
              <p className="text-lg leading-relaxed text-gray-700 text-center">
                {text[language].storyParagraph2}
              </p>
            </div>

            <div className="bg-accent-50 rounded-xl p-8 hover-lift">
              <p className="text-lg leading-relaxed text-gray-700 text-center">
                {text[language].storyParagraph3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse mb-6">
              <Users className="h-8 w-8 text-primary-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-dark-500">
                {text[language].ourTeam}
              </h2>
            </div>
            <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="hover-lift bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center group hover:border-primary-500 transition-all duration-300"
              >
                {/* Profile Image Placeholder */}
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  {member.image}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-dark-500 mb-2">
                  {member.name[language]}
                </h3>

                {/* Title */}
                <p className="text-primary-500 font-medium mb-4">
                  {member.title}
                </p>

                {/* Decorative Element */}
                <div className="w-12 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse mb-6">
              <Award className="h-8 w-8 text-highlight-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-dark-500">
                {language === 'ar' ? 'قيمنا' : 'Our Values'}
              </h2>
            </div>
            <div className="w-16 h-1 bg-highlight-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl hover-lift">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                🔍
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'الشفافية' : 'Transparency'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'نؤمن بأن الشفافية هي أساس الثقة في السوق العقاري'
                  : 'We believe transparency is the foundation of trust in the real estate market'
                }
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-accent-50 to-red-50 rounded-xl hover-lift">
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                🤝
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'الثقة' : 'Trust'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'نبني جسور الثقة بين العملاء والشركات العقارية'
                  : 'We build bridges of trust between customers and real estate companies'
                }
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-highlight-50 to-yellow-50 rounded-xl hover-lift">
              <div className="w-16 h-16 bg-highlight-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-6">
                ⭐
              </div>
              <h3 className="text-xl font-bold text-dark-500 mb-4">
                {language === 'ar' ? 'الجودة' : 'Quality'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'نسعى لتقديم أعلى مستويات الجودة في خدماتنا'
                  : 'We strive to deliver the highest quality standards in our services'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default About;