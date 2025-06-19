import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  UserPlus, 
  UserMinus,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

interface Report {
  id: string;
  created_at: string;
  review_id?: number;
  reply_id?: string;
  reporter_profile_id: string;
  reason: string;
  details: string | null;
  status: string;
  reporter_name: string;
  content_type: 'review' | 'reply';
  content_preview: string;
  company_name: string;
}

interface Category {
  id: number;
  name: string | null;
  description: string | null;
  icon_url: string | null;
  company_count: number;
}

interface Company {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  domain_name: string | null;
  is_claimed: boolean | null;
  category_name: string | null;
  category_id: number | null;
  review_count: number;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  created_at: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'categories' | 'companies' | 'users'>('reports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportFilter, setReportFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Modal states
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'company' | 'user' | null;
    item: any;
    confirmText: string;
  }>({
    isOpen: false,
    type: null,
    item: null,
    confirmText: ''
  });

  const text = {
    ar: {
      adminDashboard: 'لوحة تحكم الأدمن',
      reports: 'البلاغات',
      categories: 'الفئات',
      companies: 'الشركات',
      users: 'المستخدمين',
      pending: 'في الانتظار',
      accepted: 'مقبولة',
      declined: 'مرفوضة',
      searchReports: 'البحث في البلاغات...',
      searchCategories: 'البحث عن فئة...',
      searchCompanies: 'البحث في الشركات...',
      searchUsers: 'البحث في المستخدمين...',
      addNewCategory: 'إضافة فئة جديدة',
      addNewCompany: 'إضافة شركة جديدة',
      categoryName: 'اسم الفئة',
      categoryDescription: 'وصف الفئة',
      categoryIcon: 'أيقونة الفئة',
      uploadIcon: 'رفع أيقونة',
      uploadNewIcon: 'رفع أيقونة جديدة',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      actions: 'الإجراءات',
      dismiss: 'رفض',
      upholdAndHide: 'قبول وإخفاء',
      companyCount: 'عدد الشركات',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      categoryAdded: 'تم إضافة الفئة بنجاح',
      categoryUpdated: 'تم تحديث الفئة بنجاح',
      categoryDeleted: 'تم حذف الفئة بنجاح',
      cannotDeleteCategory: 'لا يمكن حذف فئة قيد الاستخدام',
      confirmDelete: 'تأكيد الحذف',
      typeDeleteToConfirm: 'اكتب "DELETE" للتأكيد',
      reportDismissed: 'تم رفض البلاغ',
      reportUpheld: 'تم قبول البلاغ وإخفاء المحتوى',
      invalidFileType: 'نوع الملف غير صحيح. يرجى اختيار صورة',
      fileTooLarge: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت',
      iconUploaded: 'تم رفع الأيقونة بنجاح',
      uploadingIcon: 'جاري رفع الأيقونة...'
    },
    en: {
      adminDashboard: 'Admin Dashboard',
      reports: 'Reports',
      categories: 'Categories',
      companies: 'Companies',
      users: 'Users',
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      searchReports: 'Search reports...',
      searchCategories: 'Search for a category...',
      searchCompanies: 'Search companies...',
      searchUsers: 'Search users...',
      addNewCategory: 'Add New Category',
      addNewCompany: 'Add New Company',
      categoryName: 'Category Name',
      categoryDescription: 'Category Description',
      categoryIcon: 'Category Icon',
      uploadIcon: 'Upload Icon',
      uploadNewIcon: 'Upload New Icon',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      actions: 'Actions',
      dismiss: 'Dismiss',
      upholdAndHide: 'Uphold & Hide',
      companyCount: 'Company Count',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      categoryAdded: 'Category added successfully',
      categoryUpdated: 'Category updated successfully',
      categoryDeleted: 'Category deleted successfully',
      cannotDeleteCategory: 'Cannot delete a category that is currently in use',
      confirmDelete: 'Confirm Delete',
      typeDeleteToConfirm: 'Type "DELETE" to confirm',
      reportDismissed: 'Report dismissed successfully',
      reportUpheld: 'Report upheld and content hidden',
      invalidFileType: 'Invalid file type. Please select an image',
      fileTooLarge: 'File too large. Maximum size is 5MB',
      iconUploaded: 'Icon uploaded successfully',
      uploadingIcon: 'Uploading icon...'
    }
  };

  // Check admin access and fetch data
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        onNavigate('login');
        return;
      }

      try {
        setLoading(true);
        
        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData?.is_admin) {
          setError('Access denied');
          return;
        }

        // Fetch initial data
        await Promise.all([
          fetchReports(),
          fetchCategories(),
          fetchCompanies(),
          fetchUsers()
        ]);
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchReports = async () => {
    try {
      // Fetch review reports
      const { data: reviewReports, error: reviewError } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          review_id,
          reporter_profile_id,
          reason,
          details,
          status,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(title, body, companies!reviews_company_id_fkey(name))
        `);

      if (reviewError) throw reviewError;

      // Fetch reply reports
      const { data: replyReports, error: replyError } = await supabase
        .from('reply_reports')
        .select(`
          id,
          created_at,
          reply_id,
          reporter_profile_id,
          reason,
          details,
          status,
          profiles!reply_reports_reporter_profile_id_fkey(first_name, last_name),
          company_replies!reply_reports_reply_id_fkey(reply_body, reviews!company_replies_review_id_fkey(companies!reviews_company_id_fkey(name)))
        `);

      if (replyError) throw replyError;

      // Combine and format reports
      const formattedReports: Report[] = [
        ...(reviewReports || []).map(report => ({
          id: report.id,
          created_at: report.created_at,
          review_id: report.review_id,
          reporter_profile_id: report.reporter_profile_id,
          reason: report.reason,
          details: report.details,
          status: report.status,
          reporter_name: report.profiles 
            ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim()
            : 'Unknown User',
          content_type: 'review' as const,
          content_preview: report.reviews?.title || report.reviews?.body || 'No content',
          company_name: report.reviews?.companies?.name || 'Unknown Company'
        })),
        ...(replyReports || []).map(report => ({
          id: report.id,
          created_at: report.created_at,
          reply_id: report.reply_id,
          reporter_profile_id: report.reporter_profile_id,
          reason: report.reason,
          details: report.details,
          status: report.status,
          reporter_name: report.profiles 
            ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim()
            : 'Unknown User',
          content_type: 'reply' as const,
          content_preview: report.company_replies?.reply_body || 'No content',
          company_name: report.company_replies?.reviews?.companies?.name || 'Unknown Company'
        }))
      ];

      setReports(formattedReports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Error loading reports');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get company count for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            company_count: count || 0
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get review count for each company
      const companiesWithCount = await Promise.all(
        (data || []).map(async (company) => {
          const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          return {
            ...company,
            category_name: company.categories?.name || null,
            review_count: count || 0
          };
        })
      );

      setCompanies(companiesWithCount);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Error loading companies');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    }
  };

  const handleIconFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(text[language].invalidFileType);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(text[language].fileTooLarge);
      return;
    }

    setSelectedIconFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setIconPreviewUrl(previewUrl);
  };

  const uploadIconToStorage = async (file: File, categoryId?: number): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${categoryId || Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `category-icons/${fileName}`;

    const { data, error } = await supabase.storage
      .from('category-icons')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('category-icons')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setUploadingIcon(true);
      let iconUrl = editingCategory?.icon_url || null;

      // Upload new icon if selected
      if (selectedIconFile) {
        iconUrl = await uploadIconToStorage(selectedIconFile, editingCategory?.id);
        toast.success(text[language].iconUploaded);
      }

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || null,
            icon_url: iconUrl
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success(text[language].categoryUpdated);
      } else {
        // Add new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || null,
            icon_url: iconUrl
          });

        if (error) throw error;
        toast.success(text[language].categoryAdded);
      }

      // Reset form and close modal
      setCategoryForm({ name: '', description: '' });
      setSelectedIconFile(null);
      setIconPreviewUrl(null);
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
      
      // Refresh categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || ''
    });
    setIconPreviewUrl(category.icon_url);
    setSelectedIconFile(null);
    setIsCategoryModalOpen(true);
  };

  const handleCategoryDelete = async (category: Category) => {
    if (category.company_count > 0) {
      toast.error(text[language].cannotDeleteCategory);
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      type: 'category',
      item: category,
      confirmText: ''
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirmModal.confirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteConfirmModal.item.id);

      if (error) throw error;

      toast.success(text[language].categoryDeleted);
      setDeleteConfirmModal({ isOpen: false, type: null, item: null, confirmText: '' });
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleReportAction = async (report: Report, action: 'dismiss' | 'uphold') => {
    try {
      if (action === 'dismiss') {
        // Update report status to declined
        if (report.content_type === 'review') {
          const { error } = await supabase
            .from('reports')
            .update({ status: 'declined' })
            .eq('id', report.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('reply_reports')
            .update({ status: 'declined' })
            .eq('id', report.id);
          if (error) throw error;
        }
        
        toast.success(text[language].reportDismissed);
      } else {
        // Uphold report - hide content and mark report as accepted
        if (report.content_type === 'review') {
          // Hide the review
          const { error: reviewError } = await supabase
            .from('reviews')
            .update({ status: 'hidden' })
            .eq('id', report.review_id);
          if (reviewError) throw reviewError;

          // Update report status
          const { error: reportError } = await supabase
            .from('reports')
            .update({ status: 'accepted' })
            .eq('id', report.id);
          if (reportError) throw reportError;
        } else {
          // Hide the reply
          const { error: replyError } = await supabase
            .from('company_replies')
            .update({ status: 'hidden' })
            .eq('id', report.reply_id);
          if (replyError) throw replyError;

          // Update report status
          const { error: reportError } = await supabase
            .from('reply_reports')
            .update({ status: 'accepted' })
            .eq('id', report.id);
          if (reportError) throw reportError;
        }
        
        toast.success(text[language].reportUpheld);
      }

      // Refresh reports
      await fetchReports();
    } catch (error: any) {
      console.error('Error handling report action:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Filter functions
  const filteredReports = reports.filter(report => {
    const matchesFilter = report.status === (reportFilter === 'pending' ? 'received' : reportFilter);
    const matchesSearch = report.content_preview.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                         report.company_name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                         report.reporter_name.toLowerCase().includes(reportSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{text[language].loading}</p>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-dark-500 mb-2">
              {text[language].accessDenied}
            </h1>
            <p className="text-gray-600 mb-6">
              {text[language].notAuthorized}
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-primary px-6 py-3 rounded-lg font-medium text-white hover-lift"
            >
              {text[language].backToDashboard}
            </button>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].adminDashboard}
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-4 font-medium transition-colors duration-200 ${
                activeTab === 'reports'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Flag className="h-5 w-5" />
                <span>{text[language].reports}</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 font-medium transition-colors duration-200 ${
                activeTab === 'categories'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 className="h-5 w-5" />
                <span>{text[language].categories}</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-6 py-4 font-medium transition-colors duration-200 ${
                activeTab === 'companies'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Building2 className="h-5 w-5" />
                <span>{text[language].companies}</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium transition-colors duration-200 ${
                activeTab === 'users'
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="h-5 w-5" />
                <span>{text[language].users}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              {/* Reports Filter and Search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                <div className="flex space-x-4 rtl:space-x-reverse">
                  <button
                    onClick={() => setReportFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      reportFilter === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {text[language].pending}
                  </button>
                  <button
                    onClick={() => setReportFilter('accepted')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      reportFilter === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {text[language].accepted}
                  </button>
                  <button
                    onClick={() => setReportFilter('declined')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      reportFilter === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {text[language].declined}
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    placeholder={text[language].searchReports}
                    className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Reporter</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Content</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      {reportFilter === 'pending' && (
                        <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].actions}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{report.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{report.reporter_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {report.content_preview}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{report.reason}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{report.company_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        {reportFilter === 'pending' && (
                          <td className="py-3 px-4">
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleReportAction(report, 'dismiss')}
                                className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">{text[language].dismiss}</span>
                              </button>
                              <button
                                onClick={() => handleReportAction(report, 'uphold')}
                                className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                              >
                                <X className="h-4 w-4" />
                                <span className="text-xs">{text[language].upholdAndHide}</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              {/* Categories Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder={text[language].searchCategories}
                    className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
                
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '' });
                    setSelectedIconFile(null);
                    setIconPreviewUrl(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="flex items-center space-x-2 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>{text[language].addNewCategory}</span>
                </button>
              </div>

              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">Icon</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].categoryName}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].companyCount}</th>
                      <th className="text-right rtl:text-left py-3 px-4 font-semibold text-gray-700">{text[language].actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            {category.icon_url ? (
                              <img 
                                src={category.icon_url} 
                                alt={category.name || 'Category Icon'} 
                                className="w-6 h-6 object-cover rounded"
                              />
                            ) : (
                              <Building2 className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {category.name || 'Unnamed Category'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {category.company_count}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => handleCategoryEdit(category)}
                              className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">{text[language].edit}</span>
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(category)}
                              disabled={category.company_count > 0}
                              className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg transition-colors duration-200 ${
                                category.company_count > 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-xs">{text[language].delete}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <p className="text-gray-500 text-lg">Companies management coming soon...</p>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 text-lg">Users management coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {editingCategory ? text[language].edit : text[language].addNewCategory}
              </h3>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '' });
                  setSelectedIconFile(null);
                  setIconPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {/* Category Icon Upload */}
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryIcon}
                </label>
                
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  {/* Icon Preview */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    {iconPreviewUrl ? (
                      <img 
                        src={iconPreviewUrl} 
                        alt="Icon Preview" 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingIcon}
                      className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {uploadingIcon ? text[language].uploadingIcon : text[language].uploadIcon}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label htmlFor="categoryName" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryName}
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  required
                  disabled={uploadingIcon}
                />
              </div>

              {/* Category Description */}
              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryDescription}
                </label>
                <textarea
                  id="categoryDescription"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={uploadingIcon}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '' });
                    setSelectedIconFile(null);
                    setIconPreviewUrl(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={uploadingIcon}
                >
                  {text[language].cancel}
                </button>
                <button
                  type="submit"
                  disabled={!categoryForm.name.trim() || uploadingIcon}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {uploadingIcon ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].uploadingIcon}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{text[language].save}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].confirmDelete}
              </h3>
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, item: null, confirmText: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-gray-700">
                    Are you sure you want to delete "{deleteConfirmModal.item?.name}"?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].typeDeleteToConfirm}
                </label>
                <input
                  type="text"
                  value={deleteConfirmModal.confirmText}
                  onChange={(e) => setDeleteConfirmModal(prev => ({ ...prev, confirmText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, item: null, confirmText: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {text[language].cancel}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmModal.confirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {text[language].delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;