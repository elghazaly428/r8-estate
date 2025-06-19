import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Flag, 
  Shield, 
  Search, 
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
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

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  updated_at: string;
}

interface ReviewData {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: string | null;
  verification_tag: string | null;
  created_at: string;
  is_anonymous: boolean | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  companies: {
    name: string | null;
  } | null;
}

interface CompanyData {
  id: number;
  name: string | null;
  website: string | null;
  is_claimed: boolean | null;
  created_at: string;
  review_count: number;
  avg_rating: number;
}

interface ReportData {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reviews: {
    title: string | null;
    body: string | null;
  } | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'reviews' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  
  // Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

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
      searchUsers: 'البحث في المستخدمين...',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      actions: 'الإجراءات',
      admin: 'أدمن',
      user: 'مستخدم',
      active: 'نشط',
      suspended: 'موقوف',
      suspend: 'إيقاف',
      activate: 'تفعيل',
      makeAdmin: 'جعل أدمن',
      removeAdmin: 'إزالة أدمن',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      reviewer: 'المراجع',
      company: 'الشركة',
      rating: 'التقييم',
      createdAt: 'تاريخ الإنشاء',
      published: 'منشور',
      pending: 'في الانتظار',
      flagged: 'مبلغ عنه',
      removed: 'محذوف',
      allStatuses: 'جميع الحالات',
      allCompanies: 'جميع الشركات',
      claimed: 'مطالب بها',
      unclaimed: 'غير مطالب بها',
      reason: 'السبب',
      details: 'التفاصيل',
      reporter: 'المبلغ',
      reportStatus: 'حالة البلاغ',
      pending: 'معلق',
      reviewed: 'تمت المراجعة',
      resolved: 'محلول',
      anonymous: 'مجهول',
      verificationTag: 'وسم التحقق',
      setTag: 'تعيين وسم',
      none: 'لا شيء',
      verifiedTrue: 'تم التحقق - صحيح',
      verifiedNotTrue: 'تم التحقق - غير صحيح',
      notVerified: 'لم يتم التحقق',
      tagUpdated: 'تم تحديث الوسم'
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
      searchUsers: 'Search users...',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      actions: 'Actions',
      admin: 'Admin',
      user: 'User',
      active: 'Active',
      suspended: 'Suspended',
      suspend: 'Suspend',
      activate: 'Activate',
      makeAdmin: 'Make Admin',
      removeAdmin: 'Remove Admin',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      reviewer: 'Reviewer',
      company: 'Company',
      rating: 'Rating',
      createdAt: 'Created At',
      published: 'Published',
      pending: 'Pending',
      flagged: 'Flagged',
      removed: 'Removed',
      allStatuses: 'All Statuses',
      allCompanies: 'All Companies',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      reason: 'Reason',
      details: 'Details',
      reporter: 'Reporter',
      reportStatus: 'Report Status',
      pending: 'Pending',
      reviewed: 'Reviewed',
      resolved: 'Resolved',
      anonymous: 'Anonymous',
      verificationTag: 'Verification Tag',
      setTag: 'Set Tag',
      none: 'None',
      verifiedTrue: 'Verified True',
      verifiedNotTrue: 'Verified not True',
      notVerified: 'Not Verified',
      tagUpdated: 'Tag updated'
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

        if (profileError) {
          throw profileError;
        }

        if (!profileData?.is_admin) {
          setError('Access denied');
          return;
        }

        setIsAdmin(true);
        await fetchAllData();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, onNavigate]);

  const fetchAllData = async () => {
    try {
      // Fetch stats
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

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      setUsers(usersData || []);

      // Fetch reviews with verification_tag
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          body,
          overall_rating,
          status,
          verification_tag,
          created_at,
          is_anonymous,
          profiles!reviews_profile_id_fkey(first_name, last_name, email),
          companies!reviews_company_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Fetch companies with review stats
      const { data: companiesData } = await supabase.rpc('filter_companies');
      setCompanies(companiesData || []);

      // Fetch reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          details,
          status,
          created_at,
          reviews!reports_review_id_fkey(title, body),
          profiles!reports_reporter_profile_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      setReports(reportsData || []);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'makeAdmin' | 'removeAdmin') => {
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'suspend':
          updateData = { is_suspended: true };
          break;
        case 'activate':
          updateData = { is_suspended: false };
          break;
        case 'makeAdmin':
          updateData = { is_admin: true };
          break;
        case 'removeAdmin':
          updateData = { is_admin: false };
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updateData } : user
      ));

      toast.success('User updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Error updating user');
    }
  };

  const handleVerificationTagUpdate = async (reviewId: number, tag: string | null) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ verification_tag: tag })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, verification_tag: tag } : review
      ));

      toast.success(text[language].tagUpdated);
    } catch (error: any) {
      console.error('Error updating verification tag:', error);
      toast.error('Error updating tag');
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged_for_review':
        return 'bg-red-100 text-red-800';
      case 'removed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationTagColor = (tag: string | null) => {
    switch (tag) {
      case 'Verified True':
        return 'bg-green-100 text-green-800';
      case 'Verified not True':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Verified':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationTagText = (tag: string | null) => {
    switch (tag) {
      case 'Verified True':
        return text[language].verifiedTrue;
      case 'Verified not True':
        return text[language].verifiedNotTrue;
      case 'Not Verified':
        return text[language].notVerified;
      default:
        return text[language].setTag;
    }
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = userSearchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  const filteredReviews = reviews.filter(review => {
    if (reviewStatusFilter !== 'all' && review.status !== reviewStatusFilter) {
      return false;
    }
    return true;
  });

  const filteredCompanies = companies.filter(company => {
    if (companyFilter === 'claimed') return company.is_claimed;
    if (companyFilter === 'unclaimed') return !company.is_claimed;
    return true;
  });

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

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-500 mb-2 flex items-center space-x-2 rtl:space-x-reverse">
            <Shield className="h-8 w-8 text-red-500" />
            <span>{text[language].adminDashboard}</span>
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: text[language].overview, icon: Shield },
                  { id: 'users', label: text[language].users, icon: Users },
                  { id: 'companies', label: text[language].companies, icon: Building2 },
                  { id: 'reviews', label: text[language].reviews, icon: MessageSquare },
                  { id: 'reports', label: text[language].reports, icon: Flag }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-500">{text[language].overview}</h2>
                
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
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark-500">{text[language].users}</h2>
                  <div className="relative">
                    <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={text[language].searchUsers}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].name}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].email}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].role}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].status}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email || 'No Email'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_admin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.is_admin ? text[language].admin : text[language].user}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.is_suspended ? text[language].suspended : text[language].active}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleUserAction(user.id, user.is_suspended ? 'activate' : 'suspend')}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  user.is_suspended 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {user.is_suspended ? text[language].activate : text[language].suspend}
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, user.is_admin ? 'removeAdmin' : 'makeAdmin')}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  user.is_admin 
                                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                {user.is_admin ? text[language].removeAdmin : text[language].makeAdmin}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark-500">{text[language].reviews}</h2>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">{text[language].allStatuses}</option>
                    <option value="published">{text[language].published}</option>
                    <option value="pending">{text[language].pending}</option>
                    <option value="flagged_for_review">{text[language].flagged}</option>
                    <option value="removed">{text[language].removed}</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviewer}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].company}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].rating}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].status}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].verificationTag}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].createdAt}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReviews.map((review) => (
                          <tr key={review.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {review.is_anonymous 
                                  ? text[language].anonymous
                                  : review.profiles 
                                    ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || text[language].anonymous
                                    : text[language].anonymous
                                }
                              </div>
                              {review.title && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {review.title}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {review.companies?.name || 'Unknown Company'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {renderStars(review.overall_rating)}
                                <span className="text-sm text-gray-600 ml-2 rtl:mr-2">
                                  ({review.overall_rating || 0})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                                {review.status === 'published' && text[language].published}
                                {review.status === 'pending' && text[language].pending}
                                {review.status === 'flagged_for_review' && text[language].flagged}
                                {review.status === 'removed' && text[language].removed}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <select
                                  value={review.verification_tag || ''}
                                  onChange={(e) => handleVerificationTagUpdate(review.id, e.target.value || null)}
                                  className={`appearance-none px-3 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getVerificationTagColor(review.verification_tag)}`}
                                >
                                  <option value="">{text[language].setTag}</option>
                                  <option value="Verified True">{text[language].verifiedTrue}</option>
                                  <option value="Verified not True">{text[language].verifiedNotTrue}</option>
                                  <option value="Not Verified">{text[language].notVerified}</option>
                                </select>
                                <ChevronDown className="absolute right-1 rtl:left-1 rtl:right-auto top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(review.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Companies Tab */}
            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark-500">{text[language].companies}</h2>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">{text[language].allCompanies}</option>
                    <option value="claimed">{text[language].claimed}</option>
                    <option value="unclaimed">{text[language].unclaimed}</option>
                  </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].name}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Website
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].status}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reviews}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].rating}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].createdAt}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCompanies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                                  🏢
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {company.name || 'Unnamed Company'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {company.website ? (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600">
                                  {company.website}
                                </a>
                              ) : (
                                'No Website'
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                company.is_claimed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {company.is_claimed ? text[language].claimed : text[language].unclaimed}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {company.review_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {renderStars(Math.round(company.avg_rating))}
                                <span className="text-sm text-gray-600 ml-2 rtl:mr-2">
                                  ({company.avg_rating.toFixed(1)})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(company.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-500">{text[language].reports}</h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reporter}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reason}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].details}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].reportStatus}
                          </th>
                          <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {text[language].createdAt}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {report.profiles 
                                  ? `${report.profiles.first_name || ''} ${report.profiles.last_name || ''}`.trim() || 'Anonymous'
                                  : 'Anonymous'
                                }
                              </div>
                              {report.profiles?.email && (
                                <div className="text-sm text-gray-500">
                                  {report.profiles.email}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.reason}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {report.details || 'No details provided'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.status === 'pending' && text[language].pending}
                                {report.status === 'reviewed' && text[language].reviewed}
                                {report.status === 'resolved' && text[language].resolved}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(report.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;