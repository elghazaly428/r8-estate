import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  language: 'ar' | 'en';
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ language, onNavigate }) => {
  const text = {
    ar: {
      about: 'حول',
      aboutUs: 'من نحن',
      contactUs: 'اتصل بنا',
      community: 'المجتمع',
      forReviewers: 'للمراجعين',
      forCompanies: 'للشركات',
      legal: 'قانوني',
      termsOfUse: 'شروط الاستخدام',
      privacyPolicy: 'سياسة الخصوصية',
      followUs: 'تابعنا',
      description: 'R8 ESTATE هي منصة التقييم الرائدة للعقارات في مصر. نساعد العملاء في العثور على أفضل الشركات العقارية الموثوقة.',
      email: 'info@r8estate.com',
      phone: '+20 123 456 7890',
      address: 'القاهرة، مصر',
      copyright: '© 2024 R8 ESTATE. جميع الحقوق محفوظة.'
    },
    en: {
      about: 'About',
      aboutUs: 'About Us',
      contactUs: 'Contact Us',
      community: 'Community',
      forReviewers: 'For Reviewers',
      forCompanies: 'For Companies',
      legal: 'Legal',
      termsOfUse: 'Terms of Use',
      privacyPolicy: 'Privacy Policy',
      followUs: 'Follow Us',
      description: 'R8 ESTATE is the leading real estate review platform in Egypt. We help customers find the best trusted real estate companies.',
      email: 'info@r8estate.com',
      phone: '+20 123 456 7890',
      address: 'Cairo, Egypt',
      copyright: '© 2024 R8 ESTATE. All rights reserved.'
    }
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  const handleLinkClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-dark-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1 text-center md:text-right rtl:md:text-right ltr:md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img 
                src="/Picture1.png" 
                alt="R8 ESTATE" 
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed text-sm">
              {text[language].description}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start space-x-3 rtl:space-x-reverse">
                <Mail className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <a 
                  href={`mailto:${text[language].email}`}
                  className="text-gray-300 text-sm hover:text-primary-500 transition-colors duration-200"
                >
                  {text[language].email}
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3 rtl:space-x-reverse">
                <Phone className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <a 
                  href={`tel:${text[language].phone}`}
                  className="text-gray-300 text-sm hover:text-primary-500 transition-colors duration-200"
                >
                  {text[language].phone}
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3 rtl:space-x-reverse">
                <MapPin className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{text[language].address}</span>
              </div>
            </div>
          </div>

          {/* About Links */}
          <div className="text-center md:text-right rtl:md:text-right ltr:md:text-left">
            <h3 className="font-bold text-white mb-4">{text[language].about}</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleLinkClick('about')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].aboutUs}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('contact')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].contactUs}
                </button>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div className="text-center md:text-right rtl:md:text-right ltr:md:text-left">
            <h3 className="font-bold text-white mb-4">{text[language].community}</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleLinkClick('home')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].forReviewers}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('pricing')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].forCompanies}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="text-center md:text-right rtl:md:text-right ltr:md:text-left">
            <h3 className="font-bold text-white mb-4">{text[language].legal}</h3>
            <ul className="space-y-3 mb-6">
              <li>
                <button 
                  onClick={() => handleLinkClick('terms')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].termsOfUse}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('privacy')}
                  className="text-gray-300 hover:text-primary-500 transition-colors duration-200 text-sm block w-full text-center md:text-right rtl:md:text-right ltr:md:text-left"
                >
                  {text[language].privacyPolicy}
                </button>
              </li>
            </ul>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold text-white mb-3">{text[language].followUs}</h4>
              <div className="flex space-x-3 rtl:space-x-reverse justify-center md:justify-start">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors duration-200"
                      aria-label={social.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            {text[language].copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;