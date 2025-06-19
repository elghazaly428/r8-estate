import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  BarChart3, 
  Settings, 
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Shield,
  Tag
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

interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface Report {
  id: string;
  created_at: string;
  reason: string;
  details: string | null;
  status: string;
  review_id?: number;
  reply_id?: string;
  reporter_profile_id: string;
  reporter_name?: string;
  content_type: 'review' | 'reply';
  content_preview?: string;
  company_name?: string;
}

interface Category {
  id: number;
  name: string | null;
  description: string | null;
  company_count: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reports' | 'categories'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportFilter, setReportFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const text = {
    ar: {
      // Navigation
      overview: 'نظرة عامة',
      users: 'المستخدمين',
      companies: 'الشركات',
      reports: 'البلاغات',
      categories: 'الفئات',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Reports
      filterReports: 'تصفية البلاغات',
      pending: 'معلق',
      accepted: 'مقبول',
      declined: 'مرفوض',
      searchReports: 'البحث في البلاغات...',
      reportedBy: 'أبلغ عنه',
      reason: 'السبب',
      content: 'المحتوى',
      status: 'الحالة',
      actions: 'الإجراءات',
      dismiss: 'رفض',
      upholdAndHide: 'قبول وإخفاء',
      confirmDismiss: 'هل أنت متأكد من رفض هذا البلاغ؟',
      confirmUphold: 'هل أنت متأكد من قبول هذا البلاغ وإخفاء المحتوى؟',
      reportDismissed: 'تم رفض البلاغ بنجاح',
      reportUpheld: 'تم قبول البلاغ وإخفاء المحتوى',
      
      // Categories
      addNewCategory: 'إضافة فئة جديدة',
      searchCategories: 'البحث عن فئة...',
      categoryName: 'اسم الفئة',
      companyCount: 'عدد الشركات',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      addCategory: 'إضافة فئة',
      editCategory: 'تعديل فئة',
      categoryNamePlaceholder: 'أدخل اسم الفئة',
      categoryDescriptionPlaceholder: 'أدخل وصف الفئة (اختياري)',
      description: 'الوصف',
      categoryAdded: 'تم إضافة الفئة بنجاح',
      categoryUpdated: 'تم تحديث الفئة بنجاح',
      categoryDeleted: 'تم حذف الفئة بنجاح',
      cannotDeleteCategory: 'لا يمكن حذف فئة قيد الاستخدام',
      confirmDelete: 'تأكيد الحذف',
      deleteWarning: 'هذا الإجراء لا يمكن التراجع عنه. اكتب "DELETE" للتأكيد:',
      typeDelete: 'اكتب DELETE',
      
      // Common
      loading: 'جاري التحميل...',
      saving: 'جاري الحفظ...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      errorOccurred: 'حدث خطأ',
      fillRequiredFields: 'يرجى ملء جميع الحقول المطلوبة'
    },
    en: {
      // Navigation
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reports: 'Reports',
      categories: 'Categories',
      
      // Overview
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      
      // Reports
      filterReports: 'Filter Reports',
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      searchReports: 'Search reports...',
      reportedBy: 'Reported by',
      reason: 'Reason',
      content: 'Content',
      status: 'Status',
      actions: 'Actions',
      dismiss: 'Dismiss',
      upholdAndHide: 'Uphold & Hide',
      confirmDismiss: 'Are you sure you want to dismiss this report?',
      confirmUphold: 'Are you sure you want to uphold this report and hide the content?',
      reportDismissed: 'Report dismissed successfully',
      reportUpheld: 'Report upheld and content hidden',
      
      // Categories
      addNewCategory: 'Add New Category',
      searchCategories: 'Search for a category...',
      categoryName: 'Category Name',
      companyCount: 'Company Count',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      categoryNamePlaceholder: 'Enter category name',
      categoryDescriptionPlaceholder: 'Enter category description (optional)',
      description: 'Description',
      categoryAdded: 'Category added successfully',
      categoryUpdated: 'Category updated successfully',
      categoryDeleted: 'Category deleted successfully',
      cannotDeleteCategory: 'Cannot delete a category that is currently in use',
      confirmDelete: 'Confirm Delete',
      deleteWarning: 'This action cannot be undone. Type "DELETE" to confirm:',
      typeDelete: 'Type DELETE',
      
      // Common
      loading: 'Loading...',
      saving: 'Saving...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      errorOccurred: 'An error occurred',
      fillRequiredFields: 'Please fill in all required fields'
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
        setError(null);

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

        // Fetch admin stats
        await fetchAdminStats();
        await fetchReports();
        await fetchCategories();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchAdminStats = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get total reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Get pending reports
      const { count: pendingReportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'received');

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: pendingReportsCount || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      // Fetch review reports
      const { data: reviewReports, error: reviewError } = await supabase
        .from('reports')
        .select(`
          id,
          created_at,
          reason,
          details,
          status,
          review_id,
          reporter_profile_id,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(title, body, companies!reviews_company_id_fkey(name))
        `)
        .order('created_at', { ascending: false });

      // Fetch reply reports
      const { data: replyReports, error: replyError } = await supabase
        .from('reply_reports')
        .select(`
          id,
          created_at,
          reason,
          details,
          status,
          reply_id,
          reporter_profile_id,
          profiles!reply_reports_reporter_profile_id_fkey(first_name, last_name),
          company_replies!reply_reports_reply_id_fkey(reply_body, reviews!company_replies_review_id_fkey(companies!reviews_company_id_fkey(name)))
        `)
        .order('created_at', { ascending: false });

      if (reviewError) throw reviewError;
      if (replyError) throw replyError;

      // Combine and format reports
      const allReports: Report[] = [
        ...(reviewReports || []).map(report => ({
          id: report.id,
          created_at: report.created_at,
          reason: report.reason,
          details: report.details,
          status: report.status,
          review_id: report.review_id,
          reporter_profile_id: report.reporter_profile_id,
          reporter_name: report.profiles ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() : 'Unknown',
          content_type: 'review' as const,
          content_preview: report.reviews?.title || report.reviews?.body || 'No content',
          company_name: report.reviews?.companies?.name || 'Unknown Company'
        })),
        ...(replyReports || []).map(report => ({
          id: report.id,
          created_at: report.created_at,
          reason: report.reason,
          details: report.details,
          status: report.status,
          reply_id: report.reply_id,
          reporter_profile_id: report.reporter_profile_id,
          reporter_name: report.profiles ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() : 'Unknown',
          content_type: 'reply' as const,
          content_preview: report.company_replies?.reply_body || 'No content',
          company_name: report.company_replies?.reviews?.companies?.name || 'Unknown Company'
        }))
      ];

      setReports(allReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch categories with company count
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

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
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'uphold') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const confirmMessage = action === 'dismiss' 
      ? text[language].confirmDismiss 
      : text[language].confirmUphold;

    if (!confirm(confirmMessage)) return;

    setProcessingReportId(reportId);

    try {
      if (action === 'dismiss') {
        // Update report status to declined
        const tableName = report.content_type === 'review' ? 'reports' : 'reply_reports';
        const { error } = await supabase
          .from(tableName)
          .update({ status: 'مرفوض' })
          .eq('id', reportId);

        if (error) throw error;
        toast.success(text[language].reportDismissed);
      } else {
        // Uphold report - hide content and update report status
        if (report.content_type === 'review' && report.review_id) {
          const { error: reviewError } = await supabase
            .from('reviews')
            .update({ status: 'hidden' })
            .eq('id', report.review_id);

          if (reviewError) throw reviewError;

          const { error: reportError } = await supabase
            .from('reports')
            .update({ status: 'مقبول' })
            .eq('review_id', report.review_id);

          if (reportError) throw reportError;
        } else if (report.content_type === 'reply' && report.reply_id) {
          const { error: replyError } = await supabase
            .from('company_replies')
            .update({ status: 'hidden' })
            .eq('id', report.reply_id);

          if (replyError) throw replyError;

          const { error: reportError } = await supabase
            .from('reply_reports')
            .update({ status: 'مقبول' })
            .eq('reply_id', report.reply_id);

          if (reportError) throw reportError;
        }

        toast.success(text[language].reportUpheld);
      }

      // Refresh reports and stats
      await fetchReports();
      await fetchAdminStats();
    } catch (error: any) {
      console.error('Error processing report:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setProcessingReportId(null);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      toast.error(text[language].fillRequiredFields);
      return;
    }

    setSavingCategory(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || null
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
            description: categoryForm.description.trim() || null
          });

        if (error) throw error;
        toast.success(text[language].categoryAdded);
      }

      // Reset form and close modal
      setCategoryForm({ name: '', description: '' });
      setShowCategoryModal(false);
      setEditingCategory(null);
      
      // Refresh categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(text[language].errorOccurred);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error(text[language].typeDelete);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(text[language].categoryDeleted);
      setShowDeleteConfirmation(null);
      setDeleteConfirmationText('');
      
      // Refresh categories
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(text[language].errorOccurred);
    }
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || ''
    });
    setShowCategoryModal(true);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  // Filter functions
  const filteredReports = reports.filter(report => {
    const matchesFilter = (() => {
      switch (reportFilter) {
        case 'pending': return report.status === 'received';
        case 'accepted': return report.status === 'مقبول';
        case 'declined': return report.status === 'مرفوض';
        default: return true;
      }
    })();

    const matchesSearch = reportSearchQuery === '' || 
      report.reporter_name?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      report.content_preview?.toLowerCase().includes(reportSearchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredCategories = categories.filter(category =>
    categorySearchQuery === '' ||
    category.name?.toLowerCase().includes(categorySearchQuery.toLowerCase())
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

  // Overview View
  const OverviewView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].overview}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalUsers}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalCompanies}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalCompanies}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.pendingReports}</h3>
          <p className="text-gray-600 text-sm">{text[language].pendingReports}</p>
        </div>
      </div>
    </div>
  );

  // Reports View
  const ReportsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reports}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
          {/* Filter Buttons */}
          <div className="flex space-x-2 rtl:space-x-reverse">
            {(['pending', 'accepted', 'declined'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setReportFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  reportFilter === filter
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {text[language][filter]}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
              placeholder={text[language].searchReports}
              className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reportedBy}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reason}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].content}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.reporter_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {report.content_preview}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.company_name} • {report.content_type === 'review' ? 'Review' : 'Reply'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'received' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : report.status === 'مقبول'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {report.status === 'received' ? text[language].pending :
                       report.status === 'مقبول' ? text[language].accepted :
                       text[language].declined}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {reportFilter === 'pending' && (
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          disabled={processingReportId === report.id}
                          className="inline-flex items-center px-3 py-1 border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors duration-200 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                          {text[language].dismiss}
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'uphold')}
                          disabled={processingReportId === report.id}
                          className="inline-flex items-center px-3 py-1 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                        >
                          <EyeOff className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                          {text[language].upholdAndHide}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Categories View
  const CategoriesView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].categories}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 rtl:md:space-x-reverse">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              placeholder={text[language].searchCategories}
              className="w-full px-4 py-2 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={openAddCategoryModal}
            className="btn-primary px-6 py-2 rounded-lg font-medium text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Plus className="h-4 w-4" />
            <span>{text[language].addNewCategory}</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].categoryName}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].companyCount}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {category.name || 'Unnamed Category'}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.company_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="inline-flex items-center px-3 py-1 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {text[language].edit}
                      </button>
                      <button
                        onClick={() => {
                          if (category.company_count > 0) {
                            toast.error(text[language].cannotDeleteCategory);
                          } else {
                            setShowDeleteConfirmation(category.id);
                          }
                        }}
                        disabled={category.company_count > 0}
                        className={`inline-flex items-center px-3 py-1 border rounded-lg transition-colors duration-200 ${
                          category.company_count > 0
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-red-500 text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {text[language].delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">{text[language].overview}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="h-5 w-5" />
                  <span className="font-medium">{text[language].reports}</span>
                  {stats.pendingReports > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto rtl:mr-auto rtl:ml-0">
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'categories'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Tag className="h-5 w-5" />
                  <span className="font-medium">{text[language].categories}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'categories' && <CategoriesView />}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {editingCategory ? text[language].editCategory : text[language].addCategory}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryName}
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={text[language].categoryNamePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  required
                  disabled={savingCategory}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].description}
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={text[language].categoryDescriptionPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={savingCategory}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={savingCategory}
                >
                  {text[language].cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {savingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].saving}</span>
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
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">
                {text[language].confirmDelete}
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(null);
                  setDeleteConfirmationText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  {text[language].deleteWarning}
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                dir="ltr"
              />

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(null);
                    setDeleteConfirmationText('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={() => handleDeleteCategory(showDeleteConfirmation)}
                  disabled={deleteConfirmationText !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{text[language].delete}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;