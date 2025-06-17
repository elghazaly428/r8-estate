import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  X,
  UserPlus,
  Mail,
  Building,
  Shield,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  Plus,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string, companyId?: number) => void;
}

interface Company {
  id: number;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  domain_name: string | null;
  is_claimed: boolean | null;
  category_id: number | null;
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
  email?: string;
}

interface AssignRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  language: 'ar' | 'en';
  onSuccess: () => void;
}

const AssignRepresentativeModal: React.FC<AssignRepresentativeModalProps> = ({
  isOpen,
  onClose,
  company,
  language,
  onSuccess
}) => {
  const [emailQuery, setEmailQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const text = {
    ar: {
      assignRepresentative: 'تعيين ممثل',
      assignRepresentativeFor: 'تعيين ممثل لـ',
      searchByEmail: 'البحث بالبريد الإلكتروني',
      emailPlaceholder: 'اكتب البريد الإلكتروني...',
      searching: 'جاري البحث...',
      noResults: 'لا توجد نتائج',
      selectUser: 'اختيار المستخدم',
      selectedUser: 'المستخدم المختار',
      confirmAssignment: 'تأكيد التعيين',
      cancel: 'إلغاء',
      confirmationMessage: 'أنت على وشك منح {userName} صلاحية ممثل لـ {companyName}. هل أنت متأكد؟',
      confirm: 'تأكيد',
      profileAlreadyManaged: 'هذا الملف الشخصي مُدار بالفعل.',
      userAlreadyManaging: 'هذا المستخدم يدير شركة أخرى بالفعل.',
      assignmentSuccessful: 'تم تعيين الممثل بنجاح',
      domainMismatch: 'يجب أن يكون البريد الإلكتروني من نفس نطاق الشركة',
      minCharacters: 'اكتب على الأقل 3 أحرف للبحث',
      submitting: 'جاري التعيين...'
    },
    en: {
      assignRepresentative: 'Assign Representative',
      assignRepresentativeFor: 'Assign Representative for',
      searchByEmail: 'Search by Email',
      emailPlaceholder: 'Type email address...',
      searching: 'Searching...',
      noResults: 'No results found',
      selectUser: 'Select User',
      selectedUser: 'Selected User',
      confirmAssignment: 'Confirm Assignment',
      cancel: 'Cancel',
      confirmationMessage: 'You are about to grant {userName} representative access for {companyName}. Are you sure?',
      confirm: 'Confirm',
      profileAlreadyManaged: 'This profile is already managed.',
      userAlreadyManaging: 'This user is already managing another company.',
      assignmentSuccessful: 'Representative assigned successfully',
      domainMismatch: 'Email must be from the same company domain',
      minCharacters: 'Type at least 3 characters to search',
      submitting: 'Assigning...'
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmailQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Live search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (emailQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      if (!company?.domain_name) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        // Get users from auth.users table with email domain matching
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
          console.error('Error fetching auth users:', authError);
          setSearchResults([]);
          return;
        }

        // Filter users by email domain and search query
        const filteredUsers = authUsers.users.filter(user => {
          if (!user.email) return false;
          
          // Check if email contains the search query
          const emailMatches = user.email.toLowerCase().includes(emailQuery.toLowerCase());
          
          // Check if email domain matches company domain
          const emailDomain = user.email.split('@')[1];
          const domainMatches = emailDomain === company.domain_name;
          
          return emailMatches && domainMatches;
        });

        // Get profile data for filtered users
        const userIds = filteredUsers.map(user => user.id);
        
        if (userIds.length === 0) {
          setSearchResults([]);
          return;
        }

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
          setSearchResults([]);
          return;
        }

        // Combine auth and profile data
        const combinedResults = filteredUsers.map(authUser => {
          const profile = profiles?.find(p => p.id === authUser.id);
          return {
            id: authUser.id,
            email: authUser.email,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null
          };
        });

        setSearchResults(combinedResults);
      } catch (error) {
        console.error('Error in search:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [emailQuery, company?.domain_name]);

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setEmailQuery(user.email || '');
    setSearchResults([]);
  };

  const handleConfirmAssignment = () => {
    if (!selectedUser || !company) return;
    setShowConfirmation(true);
  };

  const executeAssignment = async () => {
    if (!selectedUser || !company) return;

    setIsSubmitting(true);

    try {
      // Step 1: Check if company is already claimed
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('is_claimed')
        .eq('id', company.id)
        .single();

      if (companyError) {
        throw new Error('Failed to check company status');
      }

      if (companyData.is_claimed) {
        toast.error(text[language].profileAlreadyManaged);
        return;
      }

      // Step 2: Check if user is already managing another company
      const { data: existingRep, error: repError } = await supabase
        .from('company_representatives')
        .select('company_id')
        .eq('profile_id', selectedUser.id)
        .limit(1);

      if (repError) {
        throw new Error('Failed to check user representative status');
      }

      if (existingRep && existingRep.length > 0) {
        toast.error(text[language].userAlreadyManaging);
        return;
      }

      // Step 3: Execute the assignment
      // Update company as claimed
      const { error: updateError } = await supabase
        .from('companies')
        .update({ is_claimed: true })
        .eq('id', company.id);

      if (updateError) {
        throw new Error('Failed to update company status');
      }

      // Insert company representative
      const { error: insertRepError } = await supabase
        .from('company_representatives')
        .insert({
          company_id: company.id,
          profile_id: selectedUser.id
        });

      if (insertRepError) {
        throw new Error('Failed to assign representative');
      }

      // Create notification for the user
      const userName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'User';
      const notificationMessage = language === 'ar' 
        ? `تم منحك صلاحية ممثل لشركة ${company.name}`
        : `You have been granted representative access for ${company.name}`;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_profile_id: selectedUser.id,
          type: 'representative_assigned',
          message: notificationMessage,
          link_url: `/company/${company.id}`
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the whole operation for notification error
      }

      toast.success(text[language].assignmentSuccessful);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error executing assignment:', error);
      toast.error(error.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const getUserDisplayName = (user: UserProfile) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email || 'Unknown User';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-dark-500">
            {text[language].assignRepresentativeFor} {company?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showConfirmation ? (
          <>
            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-dark-500 mb-2">
                {text[language].searchByEmail}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  placeholder={text[language].emailPlaceholder}
                  className="w-full px-4 py-3 pr-10 rtl:pl-10 rtl:pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  dir="ltr"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Domain hint */}
              {company?.domain_name && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' ? 'يجب أن يكون من نطاق:' : 'Must be from domain:'} @{company.domain_name}
                </p>
              )}
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">{text[language].searching}</p>
              </div>
            )}

            {emailQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">{text[language].noResults}</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mb-6">
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-500">{getUserDisplayName(user)}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <h4 className="font-semibold text-dark-500 mb-2">{text[language].selectedUser}</h4>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-dark-500">{getUserDisplayName(selectedUser)}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isSubmitting}
              >
                {text[language].cancel}
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedUser || isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {text[language].confirmAssignment}
              </button>
            </div>
          </>
        ) : (
          /* Confirmation Dialog */
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            
            <h4 className="text-lg font-bold text-dark-500 mb-4">
              {text[language].confirmAssignment}
            </h4>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              {text[language].confirmationMessage
                .replace('{userName}', getUserDisplayName(selectedUser!))
                .replace('{companyName}', company?.name || '')
              }
            </p>

            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isSubmitting}
              >
                {text[language].cancel}
              </button>
              <button
                onClick={executeAssignment}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{text[language].submitting}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{text[language].confirm}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalReviews: 0,
    pendingReports: 0
  });

  const text = {
    ar: {
      adminDashboard: 'لوحة تحكم الأدمن',
      overview: 'نظرة عامة',
      companies: 'الشركات',
      users: 'المستخدمين',
      reports: 'البلاغات',
      totalUsers: 'إجمالي المستخدمين',
      totalCompanies: 'إجمالي الشركات',
      totalReviews: 'إجمالي التقييمات',
      pendingReports: 'البلاغات المعلقة',
      loading: 'جاري التحميل...',
      accessDenied: 'غير مسموح بالوصول',
      notAuthorized: 'أنت غير مخول للوصول إلى هذه الصفحة',
      backToDashboard: 'العودة إلى لوحة التحكم',
      companyName: 'اسم الشركة',
      category: 'الفئة',
      status: 'الحالة',
      claimed: 'مُدارة',
      unclaimed: 'غير مُدارة',
      actions: 'الإجراءات',
      assignRepresentative: 'تعيين ممثل',
      viewProfile: 'عرض الملف الشخصي',
      editCompany: 'تعديل الشركة',
      deleteCompany: 'حذف الشركة',
      noCompanies: 'لا توجد شركات',
      refreshData: 'تحديث البيانات'
    },
    en: {
      adminDashboard: 'Admin Dashboard',
      overview: 'Overview',
      companies: 'Companies',
      users: 'Users',
      reports: 'Reports',
      totalUsers: 'Total Users',
      totalCompanies: 'Total Companies',
      totalReviews: 'Total Reviews',
      pendingReports: 'Pending Reports',
      loading: 'Loading...',
      accessDenied: 'Access Denied',
      notAuthorized: 'You are not authorized to access this page',
      backToDashboard: 'Back to Dashboard',
      companyName: 'Company Name',
      category: 'Category',
      status: 'Status',
      claimed: 'Claimed',
      unclaimed: 'Unclaimed',
      actions: 'Actions',
      assignRepresentative: 'Assign Representative',
      viewProfile: 'View Profile',
      editCompany: 'Edit Company',
      deleteCompany: 'Delete Company',
      noCompanies: 'No companies found',
      refreshData: 'Refresh Data'
    }
  };

  // Check admin access and fetch data
  useEffect(() => {
    const checkAccessAndFetchData = async () => {
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

        // Fetch dashboard data
        await Promise.all([
          fetchStats(),
          fetchCompanies()
        ]);
      } catch (error: any) {
        console.error('Error loading admin dashboard:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndFetchData();
  }, [user, authLoading, onNavigate]);

  const fetchStats = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total companies count
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get total reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Get pending reports count
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
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const handleAssignRepresentative = (company: Company) => {
    setSelectedCompany(company);
    setAssignModalOpen(true);
  };

  const handleAssignmentSuccess = () => {
    // Refresh companies data
    fetchCompanies();
    fetchStats();
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
        <Footer language={language} onNavigate={onNavigate} />
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
        <Footer language={language} onNavigate={onNavigate} />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].companies}
          </h1>
          <div className="w-16 h-1 bg-red-500 rounded-full"></div>
        </div>
        <button
          onClick={fetchCompanies}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Search className="h-4 w-4" />
          <span>{text[language].refreshData}</span>
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{text[language].noCompanies}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].companyName}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].category}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].status}
                  </th>
                  <th className="px-6 py-3 text-right rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {text[language].actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name || 'Company'} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-dark-500">
                            {company.name || 'Unnamed Company'}
                          </div>
                          {company.domain_name && (
                            <div className="text-sm text-gray-500">
                              @{company.domain_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.categories?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.is_claimed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.is_claimed ? text[language].claimed : text[language].unclaimed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {/* Assign Representative Button - Only show for unclaimed companies */}
                        {!company.is_claimed && company.domain_name && (
                          <button
                            onClick={() => handleAssignRepresentative(company)}
                            className="flex items-center space-x-1 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                          >
                            <UserPlus className="h-3 w-3" />
                            <span>{text[language].assignRepresentative}</span>
                          </button>
                        )}
                        
                        {/* View Profile Button */}
                        <button
                          onClick={() => onNavigate('company', company.id)}
                          className="flex items-center space-x-1 rtl:space-x-reverse text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs transition-colors duration-200"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{text[language].viewProfile}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-red-50 text-red-600 border-r-4 border-red-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{text[language].reports}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'companies' && <CompaniesView />}
            {activeTab === 'users' && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Users management coming soon...</p>
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Reports management coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Representative Modal */}
      <AssignRepresentativeModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        company={selectedCompany}
        language={language}
        onSuccess={handleAssignmentSuccess}
      />

      <Footer language={language} onNavigate={onNavigate} />
    </div>
  );
};

export default AdminDashboard;