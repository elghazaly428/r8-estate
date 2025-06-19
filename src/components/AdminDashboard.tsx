import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  Grid3X3, 
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
  Eye,
  EyeOff
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

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalReviews: number;
  pendingReports: number;
}

interface FlaggedContent {
  id: string;
  type: 'review' | 'reply';
  content: string;
  author: string;
  company: string;
  created_at: string;
}

interface ResolvedReport {
  id: string;
  type: 'review' | 'reply';
  reason: string;
  content: string;
  author: string;
  company: string;
  report_date: string;
  status: string;
}

interface Category {
  id: number;
  name: string | null;
  description: string | null;
  icon_name: string | null;
  created_at: string;
  company_count: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports' | 'categories'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Dashboard data states
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });

  // Reports tab states
  const [reportFilter, setReportFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [resolvedReports, setResolvedReports] = useState<ResolvedReport[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Categories tab states
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const text = {
    ar: {
      // Navigation
      dashboard: 'لوحة تحكم الأدمن',
      overview: 'نظرة عامة',
      users: 'المستخدمين',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      categories: 'الفئات',
      
      // Overview
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      
      // Reports
      pending: 'في الانتظار',
      accepted: 'مقبولة',
      declined: 'مرفوضة',
      reportedContent: 'المحتوى المبلغ عنه',
      reason: 'السبب',
      contentAuthor: 'كاتب المحتوى',
      reportDate: 'تاريخ البلاغ',
      status: 'الحالة',
      actions: 'الإجراءات',
      
      // Categories
      categoryName: 'اسم الفئة',
      companyCount: 'عدد الشركات',
      addNewCategory: 'إضافة فئة جديدة',
      searchCategories: 'البحث في الفئات...',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      addCategory: 'إضافة فئة',
      editCategory: 'تعديل الفئة',
      deleteCategory: 'حذف الفئة',
      categoryNamePlaceholder: 'اكتب اسم الفئة...',
      confirmDelete: 'لحذف هذه الفئة، اكتب "DELETE" في الحقل أدناه:',
      cannotDeleteInUse: 'لا يمكن حذف فئة مستخدمة حالياً',
      categoryAdded: 'تم إضافة الفئة بنجاح',
      categoryUpdated: 'تم تحديث الفئة بنجاح',
      categoryDeleted: 'تم حذف الفئة بنجاح',
      
      // Reviews table
      author: 'الكاتب',
      company: 'الشركة',
      reviewTitle: 'عنوان التقييم',
      rating: 'التقييم',
      dateCreated: 'تاريخ الإنشاء',
      
      // Common
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      errorOccurred: 'حدث خطأ',
      noData: 'لا توجد بيانات',
      saving: 'جاري الحفظ...'
    },
    en: {
      // Navigation
      dashboard: 'Admin Dashboard',
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      categories: 'Categories',
      
      // Overview
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      
      // Reports
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      reportedContent: 'Reported Content',
      reason: 'Reason',
      contentAuthor: 'Content Author',
      reportDate: 'Report Date',
      status: 'Status',
      actions: 'Actions',
      
      // Categories
      categoryName: 'Category Name',
      companyCount: 'Company Count',
      addNewCategory: 'Add New Category',
      searchCategories: 'Search categories...',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete Category',
      categoryNamePlaceholder: 'Enter category name...',
      confirmDelete: 'To delete this category, type "DELETE" in the field below:',
      cannotDeleteInUse: 'Cannot delete a category that is currently in use',
      categoryAdded: 'Category added successfully',
      categoryUpdated: 'Category updated successfully',
      categoryDeleted: 'Category deleted successfully',
      
      // Reviews table
      author: 'Author',
      company: 'Company',
      reviewTitle: 'Review Title',
      rating: 'Rating',
      dateCreated: 'Date Created',
      
      // Common
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      errorOccurred: 'An error occurred',
      noData: 'No data available',
      saving: 'Saving...'
    }
  };

  // Check admin access and fetch initial data
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

        if (profileError) {
          console.error('Error checking admin status:', profileError);
          throw profileError;
        }

        if (!profileData?.is_admin) {
          onNavigate('dashboard');
          return;
        }

        setIsAdmin(true);
        await fetchDashboardStats();
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

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch total reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Fetch pending reports count
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: reportsCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchFlaggedContent = async () => {
    try {
      // Fetch flagged reviews
      const { data: flaggedReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          body,
          created_at,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies(name)
        `)
        .eq('status', 'hidden');

      if (reviewsError) {
        console.error('Error fetching flagged reviews:', reviewsError);
        throw reviewsError;
      }

      // Fetch flagged company replies
      const { data: flaggedReplies, error: repliesError } = await supabase
        .from('company_replies')
        .select(`
          id,
          reply_body,
          created_at,
          profiles!company_replies_profile_id_fkey(first_name, last_name),
          reviews(companies(name))
        `)
        .eq('status', 'hidden');

      if (repliesError) {
        console.error('Error fetching flagged replies:', repliesError);
        throw repliesError;
      }

      // Combine and format the data
      const combinedContent: FlaggedContent[] = [
        ...(flaggedReviews || []).map(review => ({
          id: `review-${review.id}`,
          type: 'review' as const,
          content: review.title || review.body || 'No content',
          author: review.profiles ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous',
          company: review.companies?.name || 'Unknown Company',
          created_at: review.created_at
        })),
        ...(flaggedReplies || []).map(reply => ({
          id: `reply-${reply.id}`,
          type: 'reply' as const,
          content: reply.reply_body || 'No content',
          author: reply.profiles ? `${reply.profiles.first_name || ''} ${reply.profiles.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous',
          company: reply.reviews?.companies?.name || 'Unknown Company',
          created_at: reply.created_at
        }))
      ];

      setFlaggedContent(combinedContent);
    } catch (error: any) {
      console.error('Error fetching flagged content:', error);
      toast.error('Error fetching flagged content: ' + error.message);
    }
  };

  const fetchResolvedReports = async (status: 'accepted' | 'declined') => {
    try {
      const statusValue = status === 'accepted' ? 'مقبول' : 'مرفوض';

      // Fetch resolved review reports
      const { data: reviewReports, error: reviewReportsError } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          created_at,
          profiles!reports_reporter_profile_id_fkey(first_name, last_name),
          reviews!reports_review_id_fkey(title, body, companies(name))
        `)
        .eq('status', statusValue);

      if (reviewReportsError) {
        console.error('Error fetching review reports:', reviewReportsError);
        throw reviewReportsError;
      }

      // Fetch resolved reply reports
      const { data: replyReports, error: replyReportsError } = await supabase
        .from('reply_reports')
        .select(`
          id,
          reason,
          created_at,
          profiles!reply_reports_reporter_profile_id_fkey(first_name, last_name),
          company_replies!reply_reports_reply_id_fkey(id, reply_body, created_at, profiles!company_replies_profile_id_fkey(first_name, last_name), reviews(companies(name)))
        `)
        .eq('status', statusValue);

      if (replyReportsError) {
        console.error('Error fetching reply reports:', replyReportsError);
        throw replyReportsError;
      }

      // Combine and format the data
      const combinedReports: ResolvedReport[] = [
        ...(reviewReports || []).map(report => ({
          id: `review-report-${report.id}`,
          type: 'review' as const,
          reason: report.reason || 'No reason provided',
          content: report.reviews?.title || report.reviews?.body || 'No content',
          author: report.profiles ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous',
          company: report.reviews?.companies?.name || 'Unknown Company',
          report_date: report.created_at,
          status: statusValue
        })),
        ...(replyReports || []).map(report => ({
          id: `reply-report-${report.id}`,
          type: 'reply' as const,
          reason: report.reason || 'No reason provided',
          content: report.company_replies?.reply_body || 'No content',
          author: report.profiles ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || 'Anonymous' : 'Anonymous',
          company: report.company_replies?.reviews?.companies?.name || 'Unknown Company',
          report_date: report.created_at,
          status: statusValue
        }))
      ];

      setResolvedReports(combinedReports);
    } catch (error: any) {
      console.error('Error fetching resolved reports:', error);
      toast.error('Error fetching resolved reports: ' + error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch categories with company count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

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
      setFilteredCategories(categoriesWithCount);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Error fetching categories: ' + error.message);
    }
  };

  // Filter categories based on search query
  useEffect(() => {
    if (categorySearchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name?.toLowerCase().includes(categorySearchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearchQuery, categories]);

  // Fetch data when report filter changes
  useEffect(() => {
    if (activeTab === 'reports') {
      if (reportFilter === 'pending') {
        fetchFlaggedContent();
      } else {
        fetchResolvedReports(reportFilter);
      }
    }
  }, [reportFilter, activeTab]);

  const handleDismissReport = async (contentId: string) => {
    setProcessingAction(contentId);
    try {
      const [type, id] = contentId.split('-');
      
      if (type === 'review') {
        // Update review status back to published
        const { error: reviewError } = await supabase
          .from('reviews')
          .update({ status: 'published' })
          .eq('id', id);

        if (reviewError) throw reviewError;

        // Update all reports for this review to declined
        const { error: reportsError } = await supabase
          .from('reports')
          .update({ status: 'مرفوض' })
          .eq('review_id', id);

        if (reportsError) throw reportsError;
      } else if (type === 'reply') {
        // Update reply status back to published
        const { error: replyError } = await supabase
          .from('company_replies')
          .update({ status: 'published' })
          .eq('id', id);

        if (replyError) throw replyError;

        // Update all reports for this reply to declined
        const { error: reportsError } = await supabase
          .from('reply_reports')
          .update({ status: 'مرفوض' })
          .eq('reply_id', id);

        if (reportsError) throw reportsError;
      }

      // Remove from flagged content
      setFlaggedContent(prev => prev.filter(item => item.id !== contentId));
      toast.success('Report dismissed successfully');
    } catch (error: any) {
      console.error('Error dismissing report:', error);
      toast.error('Error dismissing report: ' + error.message);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUpholdReport = async (contentId: string) => {
    setProcessingAction(contentId);
    try {
      const [type, id] = contentId.split('-');
      
      if (type === 'review') {
        // Update review status to hidden
        const { error: reviewError } = await supabase
          .from('reviews')
          .update({ status: 'hidden' })
          .eq('id', id);

        if (reviewError) throw reviewError;

        // Update all reports for this review to accepted
        const { error: reportsError } = await supabase
          .from('reports')
          .update({ status: 'مقبول' })
          .eq('review_id', id);

        if (reportsError) throw reportsError;
      } else if (type === 'reply') {
        // Update reply status to hidden
        const { error: replyError } = await supabase
          .from('company_replies')
          .update({ status: 'hidden' })
          .eq('id', id);

        if (replyError) throw replyError;

        // Update all reports for this reply to accepted
        const { error: reportsError } = await supabase
          .from('reply_reports')
          .update({ status: 'مقبول' })
          .eq('reply_id', id);

        if (reportsError) throw reportsError;
      }

      // Remove from flagged content
      setFlaggedContent(prev => prev.filter(item => item.id !== contentId));
      toast.success('Report upheld and content hidden');
    } catch (error: any) {
      console.error('Error upholding report:', error);
      toast.error('Error upholding report: ' + error.message);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setSavingCategory(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }]);

      if (error) throw error;

      toast.success(text[language].categoryAdded);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      await fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error('Error adding category: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editCategoryName.trim() || !selectedCategory) {
      toast.error('Please enter a category name');
      return;
    }

    setSavingCategory(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editCategoryName.trim() })
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast.success(text[language].categoryUpdated);
      setShowEditCategoryModal(false);
      setEditCategoryName('');
      setSelectedCategory(null);
      await fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error('Error updating category: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteConfirmText !== 'DELETE' || !selectedCategory) {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    if (selectedCategory.company_count > 0) {
      toast.error(text[language].cannotDeleteInUse);
      return;
    }

    setSavingCategory(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;

      toast.success(text[language].categoryDeleted);
      setShowDeleteCategoryModal(false);
      setDeleteConfirmText('');
      setSelectedCategory(null);
      await fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Error deleting category: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
  if (error || !isAdmin) {
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

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex space-x-4 rtl:space-x-reverse">
          <button
            onClick={() => setReportFilter('pending')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              reportFilter === 'pending'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {text[language].pending}
          </button>
          <button
            onClick={() => setReportFilter('accepted')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              reportFilter === 'accepted'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {text[language].accepted}
          </button>
          <button
            onClick={() => setReportFilter('declined')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              reportFilter === 'declined'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {text[language].declined}
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].reportedContent}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].reason}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].contentAuthor}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].reportDate}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].status}
                </th>
                {reportFilter === 'pending' && (
                  <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                    {text[language].actions}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportFilter === 'pending' ? (
                flaggedContent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {text[language].noData}
                    </td>
                  </tr>
                ) : (
                  flaggedContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {truncateText(item.content)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.type === 'review' ? 'Review' : 'Reply'} • {item.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Multiple reports
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.author}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {text[language].pending}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleDismissReport(item.id)}
                            disabled={processingAction === item.id}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Dismiss Report"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpholdReport(item.id)}
                            disabled={processingAction === item.id}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Uphold Report & Hide Content"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                resolvedReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {text[language].noData}
                    </td>
                  </tr>
                ) : (
                  resolvedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {truncateText(report.content)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {report.type === 'review' ? 'Review' : 'Reply'} • {report.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.reason}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.author}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(report.report_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'مقبول' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.status === 'مقبول' ? text[language].accepted : text[language].declined}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
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
          {/* Search Bar */}
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

          {/* Add Category Button */}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].categoryName}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].companyCount}
                </th>
                <th className="px-6 py-4 text-right rtl:text-right font-semibold text-dark-500">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {categorySearchQuery ? 'No categories found' : text[language].noData}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {category.name || 'Unnamed Category'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {category.company_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setEditCategoryName(category.name || '');
                            setShowEditCategoryModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                          title={text[language].edit}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (category.company_count > 0) {
                              toast.error(text[language].cannotDeleteInUse);
                              return;
                            }
                            setSelectedCategory(category);
                            setShowDeleteCategoryModal(true);
                          }}
                          disabled={category.company_count > 0}
                          className={`transition-colors duration-200 ${
                            category.company_count > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                          title={category.company_count > 0 ? text[language].cannotDeleteInUse : text[language].delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{text[language].users}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'companies'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{text[language].companies}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reviews'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">{text[language].reviews}</span>
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
                </button>
                
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'categories'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                  <span className="font-medium">{text[language].categories}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'users' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Users management coming soon...</p>
              </div>
            )}
            {activeTab === 'companies' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Companies management coming soon...</p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Reviews management coming soon...</p>
              </div>
            )}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'categories' && <CategoriesView />}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].addCategory}
              </h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryName}
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={text[language].categoryNamePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={savingCategory}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={savingCategory}
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim() || savingCategory}
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
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].editCategory}
              </h3>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditCategoryName('');
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].categoryName}
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder={text[language].categoryNamePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  disabled={savingCategory}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditCategoryName('');
                    setSelectedCategory(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={savingCategory}
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleEditCategory}
                  disabled={!editCategoryName.trim() || savingCategory}
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
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">
                {text[language].deleteCategory}
              </h3>
              <button
                onClick={() => {
                  setShowDeleteCategoryModal(false);
                  setDeleteConfirmText('');
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {language === 'ar' 
                    ? `هل أنت متأكد من حذف الفئة "${selectedCategory.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                    : `Are you sure you want to delete the category "${selectedCategory.name}"? This action cannot be undone.`
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].confirmDelete}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  dir="ltr"
                  disabled={savingCategory}
                />
              </div>

              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowDeleteCategoryModal(false);
                    setDeleteConfirmText('');
                    setSelectedCategory(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={savingCategory}
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={deleteConfirmText !== 'DELETE' || savingCategory}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {savingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].saving}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>{text[language].delete}</span>
                    </>
                  )}
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