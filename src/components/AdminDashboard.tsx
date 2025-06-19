import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Shield,
  Clock,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ChevronDown,
  Info,
  Star,
  EyeOff,
  Flag
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

interface Company {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  domain_name: string | null;
  is_claimed: boolean | null;
  category_id: number | null;
  description: string | null;
  established_in: number | null;
  location: string | null;
  created_at: string;
  categories?: {
    name: string | null;
  } | null;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  updated_at: string;
}

interface Review {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: string | null;
  created_at: string;
  is_anonymous: boolean | null;
  has_company_reply: boolean;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  companies?: {
    name: string | null;
  } | null;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  review_id: number;
  reporter_profile_id: string;
  reviews?: {
    title: string | null;
    companies?: {
      name: string | null;
    } | null;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Review filter state
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  
  // Reports filter state
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('pending');
  
  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const text = {
    ar: {
      adminDashboard: 'لوحة تحكم الأدمن',
      overview: 'نظرة عامة',
      users: 'المستخدمين',
      companies: 'الشركات',
      reviews: 'التقييمات',
      reports: 'البلاغات',
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      assignRepresentative: 'تعيين ممثل',
      searchByEmail: 'البحث بالبريد الإلكتروني...',
      selectUser: 'اختر مستخدم',
      confirmAssignment: 'تأكيد التعيين',
      cancel: 'إلغاء',
      assign: 'تعيين',
      assigning: 'جاري التعيين...',
      assignmentSuccess: 'تم تعيين الممثل بنجاح! تم إرسال إشعار للمستخدم.',
      assignmentError: 'حدث خطأ أثناء التعيين',
      companyAlreadyClaimed: 'هذه الشركة مُدارة بالفعل',
      userAlreadyRepresentative: 'هذا المستخدم يدير شركة أخرى بالفعل',
      confirmAssignmentMessage: 'هل أنت متأكد من منح {userName} صلاحية إدارة {companyName}؟',
      domain: 'النطاق',
      noDomain: 'لا يوجد نطاق',
      status: 'الحالة',
      claimed: 'مُدارة',
      unclaimed: 'غير مُدارة',
      actions: 'الإجراءات',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      admin: 'أدمن',
      suspended: 'موقوف',
      active: 'نشط',
      noResults: 'لا توجد نتائج',
      searchingUsers: 'جاري البحث عن المستخدمين...',
      userNotFound: 'لم يتم العثور على مستخدمين',
      domainMismatch: 'تحذير: لا يوجد نطاق محدد للشركة، البحث في جميع المستخدمين',
      emailDomainMatch: 'تطابق نطاق البريد الإلكتروني',
      emailDomainMismatch: 'عدم تطابق نطاق البريد الإلكتروني',
      // Reviews specific text
      filterByStatus: 'تصفية حسب الحالة',
      allStatuses: 'جميع الحالات',
      published: 'منشور',
      hidden: 'مخفي',
      removed: 'محذوف',
      deleted: 'محذوف نهائياً',
      author: 'الكاتب',
      company: 'الشركة',
      reviewTitle: 'عنوان التقييم',
      rating: 'التقييم',
      dateCreated: 'تاريخ الإنشاء',
      hide: 'إخفاء',
      unhide: 'إظهار',
      delete: 'حذف',
      confirmHide: 'هل أنت متأكد من إخفاء هذا التقييم؟',
      confirmUnhide: 'هل أنت متأكد من إظهار هذا التقييم؟',
      confirmDelete: 'هل أنت متأكد من حذف هذا التقييم نهائياً؟',
      hideSuccess: 'تم إخفاء التقييم بنجاح',
      unhideSuccess: 'تم إظهار التقييم بنجاح',
      deleteSuccess: 'تم حذف التقييم بنجاح',
      hideError: 'حدث خطأ أثناء إخفاء التقييم',
      unhideError: 'حدث خطأ أثناء إظهار التقييم',
      deleteError: 'حدث خطأ أثناء حذف التقييم',
      cannotDeleteWithReply: 'لا يمكن حذف التقييم لأن الشركة قد ردت عليه',
      anonymous: 'مجهول',
      noReviews: 'لا توجد تقييمات',
      // Reports specific text
      pending: 'في الانتظار',
      accepted: 'مقبولة',
      declined: 'مرفوضة',
      reportedContent: 'المحتوى المبلغ عنه',
      reason: 'السبب',
      contentAuthor: 'كاتب المحتوى',
      reportDate: 'تاريخ البلاغ',
      noReports: 'لا توجد بلاغات',
      inappropriateContent: 'محتوى غير مناسب',
      spam: 'رسائل مزعجة',
      fakeReview: 'تقييم مزيف'
    },
    en: {
      adminDashboard: 'Admin Dashboard',
      overview: 'Overview',
      users: 'Users',
      companies: 'Companies',
      reviews: 'Reviews',
      reports: 'Reports',
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      assignRepresentative: 'Assign Representative',
      searchByEmail: 'Search by email...',
      selectUser: 'Select User',
      confirmAssignment: 'Confirm Assignment',
      cancel: 'Cancel',
      assign: 'Assign',
      assigning: 'Assigning...',
      assignmentSuccess: 'Representative assigned successfully! User has been notified.',
      assignmentError: 'Error assigning representative',
      companyAlreadyClaimed: 'This company is already managed',
      userAlreadyRepresentative: 'This user is already managing another company',
      confirmAssignmentMessage: 'Are you sure you want to grant {userName} representative access for {companyName}?',
      domain: 'Domain',
      noDomain: 'No Domain',
      status: 'Status',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      actions: 'Actions',
      name: 'Name',
      email: 'Email',
      admin: 'Admin',
      suspended: 'Suspended',
      active: 'Active',
      noResults: 'No results found',
      searchingUsers: 'Searching users...',
      userNotFound: 'No users found',
      domainMismatch: 'Warning: No domain set for company, searching all users',
      emailDomainMatch: 'Email domain matches',
      emailDomainMismatch: 'Email domain does not match',
      // Reviews specific text
      filterByStatus: 'Filter by Status',
      allStatuses: 'All Statuses',
      published: 'Published',
      hidden: 'Hidden',
      removed: 'Removed',
      deleted: 'Deleted',
      author: 'Author',
      company: 'Company',
      reviewTitle: 'Review Title',
      rating: 'Rating',
      dateCreated: 'Date Created',
      hide: 'Hide',
      unhide: 'Unhide',
      delete: 'Delete',
      confirmHide: 'Are you sure you want to hide this review?',
      confirmUnhide: 'Are you sure you want to unhide this review?',
      confirmDelete: 'Are you sure you want to permanently delete this review?',
      hideSuccess: 'Review hidden successfully',
      unhideSuccess: 'Review unhidden successfully',
      deleteSuccess: 'Review deleted successfully',
      hideError: 'Error hiding review',
      unhideError: 'Error unhiding review',
      deleteError: 'Error deleting review',
      cannotDeleteWithReply: 'Cannot delete review because the company has replied to it',
      anonymous: 'Anonymous',
      noReviews: 'No reviews found',
      // Reports specific text
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      reportedContent: 'Reported Content',
      reason: 'Reason',
      contentAuthor: 'Content Author',
      reportDate: 'Report Date',
      noReports: 'No reports found',
      inappropriateContent: 'Inappropriate Content',
      spam: 'Spam',
      fakeReview: 'Fake Review'
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

        // Fetch admin stats and data
        await Promise.all([
          fetchStats(),
          fetchCompanies(),
          fetchUsers(),
          fetchReviews(),
          fetchReports()
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

  const fetchStats = async () => {
    try {
      const [usersCount, companiesCount, reviewsCount, reportsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalCompanies: companiesCount.count || 0,
        totalReviews: reviewsCount.count || 0,
        pendingReports: reportsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
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
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReviews = async (statusFilter: string = 'all') => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_profile_id_fkey(first_name, last_name),
          companies(name)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Check for company replies for each review
      const reviewsWithReplyStatus = await Promise.all(
        (data || []).map(async (review) => {
          const { data: replyData, error: replyError } = await supabase
            .from('company_replies')
            .select('id')
            .eq('review_id', review.id)
            .limit(1);

          if (replyError) {
            console.error('Error checking company reply:', replyError);
            return { ...review, has_company_reply: false };
          }

          return {
            ...review,
            has_company_reply: replyData && replyData.length > 0
          };
        })
      );

      setReviews(reviewsWithReplyStatus);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reviews(title, companies(name)),
          profiles!reports_reporter_profile_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  // Handle review status toggle (hide/unhide)
  const handleToggleReviewStatus = async (reviewId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
    const confirmMessage = newStatus === 'hidden' ? text[language].confirmHide : text[language].confirmUnhide;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: newStatus }
          : review
      ));

      const successMessage = newStatus === 'hidden' ? text[language].hideSuccess : text[language].unhideSuccess;
      toast.success(successMessage);
    } catch (error: any) {
      console.error('Error toggling review status:', error);
      const errorMessage = newStatus === 'hidden' ? text[language].hideError : text[language].unhideError;
      toast.error(errorMessage);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: number, hasCompanyReply: boolean) => {
    if (hasCompanyReply) {
      toast.error(text[language].cannotDeleteWithReply);
      return;
    }

    if (!confirm(text[language].confirmDelete)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success(text[language].deleteSuccess);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(text[language].deleteError);
    }
  };

  // Search users by email in profiles table
  const performSearch = async (query: string) => {
    if (!selectedCompany || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Search profiles table by email
      const { data: profileResults, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url, is_admin, is_suspended, updated_at')
        .ilike('email', `%${query}%`);
      
      if (profileError) {
        throw profileError;
      }

      if (!profileResults || profileResults.length === 0) {
        setSearchResults([]);
        return;
      }

      // Filter by domain if company has domain_name set
      let filteredResults = profileResults;
      
      if (selectedCompany.domain_name) {
        const companyDomain = selectedCompany.domain_name.toLowerCase();
        
        filteredResults = profileResults.filter(profile => {
          if (!profile.email) return false;
          
          const emailDomain = profile.email.split('@')[1]?.toLowerCase();
          return emailDomain === companyDomain;
        });
      }

      setSearchResults(filteredResults);

    } catch (error: any) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      toast.error('Error searching users');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCompany]);

  // Fetch reviews when status filter changes
  useEffect(() => {
    if (!loading && user) {
      fetchReviews(reviewStatusFilter);
    }
  }, [reviewStatusFilter]);

  const handleAssignRepresentative = async () => {
    if (!selectedCompany || !selectedUser) return;

    setIsAssigning(true);

    try {
      // Check if company is already claimed
      const { data: companyCheck, error: companyError } = await supabase
        .from('companies')
        .select('is_claimed')
        .eq('id', selectedCompany.id)
        .single();

      if (companyError) throw companyError;

      if (companyCheck.is_claimed) {
        toast.error(text[language].companyAlreadyClaimed);
        return;
      }

      // Check if user is already a representative
      const { data: repCheck, error: repError } = await supabase
        .from('company_representatives')
        .select('company_id')
        .eq('profile_id', selectedUser.id)
        .limit(1);

      if (repError) throw repError;

      if (repCheck && repCheck.length > 0) {
        toast.error(text[language].userAlreadyRepresentative);
        return;
      }

      // Confirm assignment
      const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim();
      const confirmMessage = text[language].confirmAssignmentMessage
        .replace('{userName}', userName)
        .replace('{companyName}', selectedCompany.name || '');

      if (!confirm(confirmMessage)) {
        return;
      }

      // Perform assignment
      const { error: updateError } = await supabase
        .from('companies')
        .update({ is_claimed: true })
        .eq('id', selectedCompany.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('company_representatives')
        .insert({
          company_id: selectedCompany.id,
          profile_id: selectedUser.id
        });

      if (insertError) throw insertError;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_profile_id: user!.id,
          action_type: 'assigned_rep',
          target_profile_id: selectedUser.id,
          target_company_id: selectedCompany.id,
          details: `Assigned ${userName} as representative for ${selectedCompany.name}`
        });

      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          recipient_profile_id: selectedUser.id,
          type: 'representative_assigned',
          message: `An administrator has granted you representative access for ${selectedCompany.name}`,
          link_url: `/company/${selectedCompany.id}`
        });

      toast.success(text[language].assignmentSuccess);
      setAssignModalOpen(false);
      setSelectedCompany(null);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      
      // Refresh companies data
      fetchCompanies();

    } catch (error: any) {
      console.error('Error assigning representative:', error);
      toast.error(text[language].assignmentError);
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper function to check if email domain matches company domain
  const checkEmailDomainMatch = (email: string | null, companyDomain: string | null): boolean => {
    if (!email || !companyDomain) return false;
    const emailDomain = email.split('@')[1]?.toLowerCase();
    return emailDomain === companyDomain.toLowerCase();
  };

  // Helper functions for status display
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'published':
        return text[language].published;
      case 'hidden':
        return text[language].hidden;
      case 'removed':
        return text[language].removed;
      case 'deleted':
        return text[language].deleted;
      default:
        return text[language].published;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'hidden':
        return 'bg-yellow-100 text-yellow-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const renderStars = (rating: number | null) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < ratingValue ? 'fill-current text-highlight-500' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
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
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.totalReviews}</h3>
          <p className="text-gray-600 text-sm">{text[language].totalReviews}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-dark-500 mb-1">{stats.pendingReports}</h3>
          <p className="text-gray-600 text-sm">{text[language].pendingReports}</p>
        </div>
      </div>
    </div>
  );

  // Companies View
  const CompaniesView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].companies}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].name}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].domain}
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
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name || 'Company'} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          '🏢'
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.name || 'Unnamed Company'}
                        </div>
                        {company.categories && (
                          <div className="text-sm text-gray-500">
                            {company.categories.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.domain_name ? (
                      <span className="text-blue-600">{company.domain_name}</span>
                    ) : (
                      <span className="text-red-500 text-xs">{text[language].noDomain}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.is_claimed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.is_claimed ? text[language].claimed : text[language].unclaimed}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCompany(company);
                        setAssignModalOpen(true);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      disabled={company.is_claimed}
                      className={`inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        company.is_claimed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{text[language].assignRepresentative}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reviews View
  const ReviewsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reviews}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <label className="text-sm font-medium text-gray-700">
            {text[language].filterByStatus}:
          </label>
          <select
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">{text[language].allStatuses}</option>
            <option value="published">{text[language].published}</option>
            <option value="hidden">{text[language].hidden}</option>
            <option value="removed">{text[language].removed}</option>
            <option value="deleted">{text[language].deleted}</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].author}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].company}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reviewTitle}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].rating}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].status}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].dateCreated}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {text[language].noReviews}
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.is_anonymous 
                        ? text[language].anonymous
                        : review.profiles 
                          ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
                          : text[language].anonymous
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {review.companies?.name || 'Unknown Company'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">
                        {review.title || 'No title'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {renderStars(review.overall_rating)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                        {getStatusText(review.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {/* Hide/Unhide Button */}
                        {review.status === 'published' && (
                          <button
                            onClick={() => handleToggleReviewStatus(review.id, review.status)}
                            className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            <EyeOff className="h-4 w-4" />
                            <span>{text[language].hide}</span>
                          </button>
                        )}
                        
                        {review.status === 'hidden' && (
                          <button
                            onClick={() => handleToggleReviewStatus(review.id, review.status)}
                            className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{text[language].unhide}</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteReview(review.id, review.has_company_reply)}
                          disabled={review.has_company_reply}
                          className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            review.has_company_reply
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title={review.has_company_reply ? text[language].cannotDeleteWithReply : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{text[language].delete}</span>
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

  // Reports View
  const ReportsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-500 mb-2">
          {text[language].reports}
        </h1>
        <div className="w-16 h-1 bg-red-500 rounded-full"></div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <button
            onClick={() => setReportStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              reportStatusFilter === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {text[language].pending}
          </button>
          <button
            onClick={() => setReportStatusFilter('accepted')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              reportStatusFilter === 'accepted'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {text[language].accepted}
          </button>
          <button
            onClick={() => setReportStatusFilter('declined')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              reportStatusFilter === 'declined'
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
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reportedContent}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reason}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].contentAuthor}
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {text[language].reportDate}
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
              {/* Placeholder Data - Row 1 */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate">
                    "تجربة سيئة جداً مع هذه الشركة..."
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    شركة العقارات المتميزة
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {text[language].inappropriateContent}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  أحمد محمد
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate('2024-01-15T10:30:00Z')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    {text[language].pending}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>✅</span>
                    </button>
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <X className="h-4 w-4" />
                      <span>❌</span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Placeholder Data - Row 2 */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate">
                    "هذا التقييم مزيف ومدفوع الأجر"
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    مجموعة الإسكان الحديث
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {text[language].fakeReview}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  فاطمة علي
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate('2024-01-14T14:20:00Z')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    {text[language].pending}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>✅</span>
                    </button>
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <X className="h-4 w-4" />
                      <span>❌</span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Placeholder Data - Row 3 */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate">
                    "رسائل دعائية متكررة في التقييمات"
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    شركة التطوير العقاري الذكي
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {text[language].spam}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  محمد حسن
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate('2024-01-13T09:15:00Z')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    {text[language].pending}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>✅</span>
                    </button>
                    <button className="inline-flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                      <X className="h-4 w-4" />
                      <span>❌</span>
                    </button>
                  </div>
                </td>
              </tr>
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
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">{text[language].overview}</span>
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
                  <FileText className="h-5 w-5" />
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
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'reports' && <ReportsView />}
          </div>
        </div>
      </div>

      {/* Assign Representative Modal */}
      {assignModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">
                {text[language].assignRepresentative}
              </h3>
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedCompany(null);
                  setSelectedUser(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {selectedCompany.name}
              </p>
              <p className="text-xs text-gray-500">
                {text[language].domain}: {selectedCompany.domain_name || text[language].noDomain}
              </p>
            </div>

            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold text-dark-500 mb-2">
                  {text[language].searchByEmail}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={text[language].searchByEmail}
                    className="w-full px-3 py-2 pr-10 rtl:pl-10 rtl:pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">{text[language].searchingUsers}</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((user) => {
                    const domainMatches = checkEmailDomainMatch(user.email, selectedCompany.domain_name);
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedUser?.id === user.id ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                          {selectedCompany.domain_name && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              domainMatches 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {domainMatches ? '✓' : '✗'}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {text[language].userNotFound}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800">
                    {text[language].selectUser}: {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p className="text-xs text-blue-600">
                    {selectedUser.email}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setAssignModalOpen(false);
                    setSelectedCompany(null);
                    setSelectedUser(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isAssigning}
                >
                  {text[language].cancel}
                </button>
                <button
                  onClick={handleAssignRepresentative}
                  disabled={!selectedUser || isAssigning}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{text[language].assigning}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>{text[language].assign}</span>
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