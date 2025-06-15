import React, { useState, useEffect, useRef } from 'react';
import { User, Star, FileText, Settings, Edit, Trash2, Save, AlertTriangle, CheckCircle, Upload, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  language: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onNavigate: (page: string) => void;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

interface UserReview {
  id: number;
  title: string | null;
  body: string | null;
  overall_rating: number | null;
  status: 'pending_approval' | 'published' | 'removed' | null;
  created_at: string;
  companies: {
    name: string | null;
  } | null;
  has_company_reply: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ language, onLanguageChange, onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'reviews' | 'profile'>('reviews');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const text = {
    ar: {
      dashboard: 'لوحة التحكم',
      myReviews: 'تقييماتي',
      profileSettings: 'إعدادات الملف الشخصي',
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      saveChanges: 'حفظ التغييرات',
      edit: 'تعديل',
      delete: 'حذف',
      status: 'الحالة',
      published: 'منشور',
      pending: 'في الانتظار',
      removed: 'محذوف',
      loading: 'جاري التحميل...',
      saving: 'جاري الحفظ...',
      submittedOn: 'تم الإرسال في',
      noReviews: 'لا توجد تقييمات حتى الآن',
      personalInfo: 'المعلومات الشخصية',
      confirmDelete: 'هل أنت متأكد من حذف هذا التقييم؟',
      deleteSuccess: 'تم حذف التقييم بنجاح',
      deleteError: 'حدث خطأ أثناء حذف التقييم',
      profileUpdateSuccess: 'تم تحديث الملف الشخصي بنجاح',
      profileUpdateError: 'حدث خطأ أثناء تحديث الملف الشخصي',
      passwordUpdateSuccess: 'تم تغيير كلمة المرور بنجاح',
      passwordUpdateError: 'حدث خطأ أثناء تغيير كلمة المرور',
      passwordMismatch: 'كلمات المرور الجديدة غير متطابقة',
      fillAllFields: 'يرجى ملء جميع الحقول المطلوبة',
      cannotDeleteWithReply: 'لا يمكن حذف التقييم لأن الشركة قد ردت عليه',
      cannotEditWithReply: 'لا يمكن تعديل التقييم لأن الشركة قد ردت عليه',
      disabledTooltip: 'لا يمكن تعديل أو حذف هذا التقييم لأنه قد تم الرد عليه من قبل الشركة.',
      profilePicture: 'الصورة الشخصية',
      uploadNewPicture: 'رفع صورة جديدة',
      uploading: 'جاري الرفع...',
      avatarUpdateSuccess: 'تم تحديث الصورة الشخصية بنجاح',
      avatarUpdateError: 'حدث خطأ أثناء تحديث الصورة الشخصية',
      invalidFileType: 'نوع الملف غير صحيح. يرجى اختيار صورة (PNG, JPG, JPEG)',
      fileTooLarge: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت'
    },
    en: {
      dashboard: 'Dashboard',
      myReviews: 'My Reviews',
      profileSettings: 'Profile Settings',
      firstName: 'First Name',
      lastName: 'Last Name',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      saveChanges: 'Save Changes',
      edit: 'Edit',
      delete: 'Delete',
      status: 'Status',
      published: 'Published',
      pending: 'Pending',
      removed: 'Removed',
      loading: 'Loading...',
      saving: 'Saving...',
      submittedOn: 'Submitted on',
      noReviews: 'No reviews yet',
      personalInfo: 'Personal Information',
      confirmDelete: 'Are you sure you want to delete this review?',
      deleteSuccess: 'Review deleted successfully',
      deleteError: 'Error deleting review',
      profileUpdateSuccess: 'Profile updated successfully',
      profileUpdateError: 'Error updating profile',
      passwordUpdateSuccess: 'Password changed successfully',
      passwordUpdateError: 'Error changing password',
      passwordMismatch: 'New passwords do not match',
      fillAllFields: 'Please fill in all required fields',
      cannotDeleteWithReply: 'Cannot delete review because the company has replied to it',
      cannotEditWithReply: 'Cannot edit review because the company has replied to it',
      disabledTooltip: 'This review cannot be edited or deleted because the company has replied to it.',
      profilePicture: 'Profile Picture',
      uploadNewPicture: 'Upload New Picture',
      uploading: 'Uploading...',
      avatarUpdateSuccess: 'Profile picture updated successfully',
      avatarUpdateError: 'Error updating profile picture',
      invalidFileType: 'Invalid file type. Please select an image (PNG, JPG, JPEG)',
      fileTooLarge: 'File too large. Maximum size is 5MB'
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      onNavigate('login');
    }
  }, [user, authLoading, onNavigate]);

  // Fetch user data when component mounts
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile(profileData);
      
      // Set form data
      if (profileData) {
        setProfileForm({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || ''
        });
      }

      // Fetch user reviews with company names and check for company replies
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          title,
          body,
          overall_rating,
          status,
          created_at,
          companies!reviews_company_id_fkey(name)
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      // For each review, check if it has a company reply
      const reviewsWithReplyStatus = await Promise.all(
        (reviewsData || []).map(async (review) => {
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

      setUserReviews(reviewsWithReplyStatus);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error(text[language].profileUpdateError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number, hasCompanyReply: boolean) => {
    // Check if review has company reply
    if (hasCompanyReply) {
      toast.error(text[language].cannotDeleteWithReply);
      return;
    }

    if (!confirm(text[language].confirmDelete)) {
      return;
    }

    try {
      // Double-check for company reply before deletion
      const { data: replyCheck, error: replyCheckError } = await supabase
        .from('company_replies')
        .select('id')
        .eq('review_id', reviewId)
        .limit(1);

      if (replyCheckError) {
        throw replyCheckError;
      }

      if (replyCheck && replyCheck.length > 0) {
        toast.error(text[language].cannotDeleteWithReply);
        return;
      }

      // Delete the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('profile_id', user?.id); // Ensure user can only delete their own reviews

      if (error) {
        throw error;
      }

      // Remove from local state
      setUserReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success(text[language].deleteSuccess);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(text[language].deleteError);
    }
  };

  const handleEditReview = (reviewId: number, hasCompanyReply: boolean) => {
    if (hasCompanyReply) {
      toast.error(text[language].cannotEditWithReply);
      return;
    }
    
    // TODO: Implement edit functionality
    console.log('Edit review:', reviewId);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(text[language].invalidFileType);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(text[language].fileTooLarge);
      return;
    }

    setUploadingAvatar(true);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true // Replace existing file
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      } : null);

      toast.success(text[language].avatarUpdateSuccess);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(text[language].avatarUpdateError);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error(text[language].fillAllFields);
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profileForm.firstName.trim(),
          last_name: profileForm.lastName.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        first_name: profileForm.firstName.trim(),
        last_name: profileForm.lastName.trim(),
        updated_at: new Date().toISOString()
      } : null);

      toast.success(text[language].profileUpdateSuccess);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(text[language].profileUpdateError);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(text[language].fillAllFields);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(text[language].passwordMismatch);
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        throw error;
      }

      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success(text[language].passwordUpdateSuccess);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(text[language].passwordUpdateError);
    } finally {
      setSaving(false);
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'published':
        return text[language].published;
      case 'pending_approval':
        return text[language].pending;
      case 'removed':
        return text[language].removed;
      default:
        return text[language].pending;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Tooltip component
  const Tooltip: React.FC<{ children: React.ReactNode; content: string; disabled?: boolean }> = ({ 
    children, 
    content, 
    disabled = false 
  }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (!disabled) {
      return <>{children}</>;
    }

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap max-w-xs">
            <div className="text-center leading-relaxed">
              {content}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    );
  };

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

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-500 mb-2">
            {text[language].dashboard}
          </h1>
          <div className="w-16 h-1 bg-primary-500 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'reviews'
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{text[language].myReviews}</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-500 rtl:border-l-4 rtl:border-r-0'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">{text[language].profileSettings}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* My Reviews View */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-dark-500 mb-6">
                  {text[language].myReviews}
                </h2>
                
                {userReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 text-lg">{text[language].noReviews}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                          <div className="flex-1 mb-4 md:mb-0">
                            <h3 className="text-lg font-bold text-dark-500 mb-2">
                              {review.companies?.name || 'Unknown Company'}
                            </h3>
                            {review.title && (
                              <p className="text-gray-700 mb-3">
                                {review.title}
                              </p>
                            )}
                            
                            {/* Rating */}
                            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                {renderStars(review.overall_rating)}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({review.overall_rating || 0}/5)
                              </span>
                            </div>
                            
                            {/* Status and Date */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 rtl:sm:space-x-reverse space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <span className="text-sm text-gray-600">{text[language].status}:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                                  {getStatusText(review.status)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {text[language].submittedOn} {formatDate(review.created_at)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-3 rtl:space-x-reverse">
                            <Tooltip 
                              content={text[language].disabledTooltip} 
                              disabled={review.has_company_reply}
                            >
                              <button 
                                onClick={() => handleEditReview(review.id, review.has_company_reply)}
                                disabled={review.has_company_reply}
                                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border rounded-lg transition-colors duration-200 ${
                                  review.has_company_reply
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                                    : 'border-primary-500 text-primary-500 hover:bg-primary-50'
                                }`}
                              >
                                <Edit className="h-4 w-4" />
                                <span>{text[language].edit}</span>
                              </button>
                            </Tooltip>
                            
                            <Tooltip 
                              content={text[language].disabledTooltip} 
                              disabled={review.has_company_reply}
                            >
                              <button 
                                onClick={() => handleDeleteReview(review.id, review.has_company_reply)}
                                disabled={review.has_company_reply}
                                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border rounded-lg transition-colors duration-200 ${
                                  review.has_company_reply
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                                    : 'border-red-500 text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{text[language].delete}</span>
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Settings View */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-dark-500 mb-6">
                  {text[language].profileSettings}
                </h2>
                
                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-dark-500 mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                      <Camera className="h-5 w-5 text-primary-500" />
                      <span>{text[language].profilePicture}</span>
                    </h3>
                    
                    <div className="flex items-center space-x-6 rtl:space-x-reverse">
                      {/* Avatar Display */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                          {userProfile?.avatar_url ? (
                            <img 
                              src={userProfile.avatar_url} 
                              alt="Profile Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-100">
                              <User className="h-12 w-12 text-primary-500" />
                            </div>
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      
                      
                      {/* Upload Button */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpg,image/jpeg"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingAvatar ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>{text[language].uploading}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>{text[language].uploadNewPicture}</span>
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          {language === 'ar' 
                            ? 'PNG, JPG, JPEG - حد أقصى 5 ميجابايت'
                            : 'PNG, JPG, JPEG - Max 5MB'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <form onSubmit={handleProfileUpdate}>
                    <h3 className="text-lg font-semibold text-dark-500 mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                      <User className="h-5 w-5 text-primary-500" />
                      <span>{text[language].personalInfo}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-dark-500 mb-2">
                          {text[language].firstName}
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                          disabled={saving}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-dark-500 mb-2">
                          {text[language].lastName}
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                          disabled={saving}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary px-8 py-3 rounded-lg font-semibold text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-5 w-5" />
                      <span>{saving ? text[language].saving : text[language].saveChanges}</span>
                    </button>
                  </form>

                  {/* Change Password Section */}
                  <div className="border-t border-gray-200 pt-8">
                    <form onSubmit={handlePasswordUpdate}>
                      <h3 className="text-lg font-semibold text-dark-500 mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                        <Settings className="h-5 w-5 text-primary-500" />
                        <span>{text[language].changePassword}</span>
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-semibold text-dark-500 mb-2">
                            {text[language].currentPassword}
                          </label>
                          <input
                            type="password"
                            id="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                            dir="ltr"
                            disabled={saving}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-semibold text-dark-500 mb-2">
                              {text[language].newPassword}
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                              dir="ltr"
                              disabled={saving}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-500 mb-2">
                              {text[language].confirmPassword}
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                              dir="ltr"
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary px-8 py-3 rounded-lg font-semibold text-white hover-lift flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="h-5 w-5" />
                          <span>{saving ? text[language].saving : text[language].saveChanges}</span>
                        </button>
                      </div>
                    </form>
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

export default Dashboard;