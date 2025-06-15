import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Add validation for URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid Supabase URL format')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Test connection function
export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Supabase connection test failed:', error)
    return { success: false, error: error.message }
  }
}

// Database types based on the schema
export interface Profile {
  id: string
  updated_at: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export interface Company {
  id: number
  created_at: string
  name: string | null
  logo_url: string | null
  website: string | null
  domain_name: string | null
  is_claimed: boolean | null
  category_id: number | null
  description: string | null
  established_in: number | null
  location: string | null
}

// Extended company interface for search results with ratings
export interface CompanySearchResult {
  id: number
  name: string | null
  logo_url: string | null
  website: string | null
  avg_rating: number
  review_count: number
}

export interface Review {
  id: number
  created_at: string
  profile_id: string | null
  company_id: number | null
  title: string | null
  body: string | null
  rating_communication: number | null
  rating_responsiveness: number | null
  rating_value: number | null
  rating_friendliness: number | null
  overall_rating: number | null
  date_of_experience: string | null
  has_document: boolean | null
  is_anonymous: boolean | null
  status: 'pending_approval' | 'published' | 'removed' | 'flagged_for_review' | null
}

export interface Category {
  id: number
  created_at: string
  name: string | null
  description: string | null
  icon_name: string | null
}

export interface ReviewVote {
  review_id: number
  profile_id: string
}

export interface Report {
  id: string
  review_id: number
  reporter_profile_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

export interface CompanyRepresentative {
  id: string
  company_id: number
  profile_id: string
  role: string
  verified_at: string
  created_at: string
}

export interface CompanyReply {
  id: string
  created_at: string
  reply_body: string | null
  review_id: number
  profile_id: string | null
  status?: string | null
}

export interface ReplyVote {
  reply_id: string
  profile_id: string
}

export interface ReplyReport {
  id: string
  reply_id: string
  reporter_profile_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

// Notification interface
export interface Notification {
  id: string
  recipient_profile_id: string
  type: string
  message: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

// Extended interfaces for joined data
export interface CompanyWithCategory extends Company {
  categories: Category | null
}

export interface ReviewWithProfile extends Review {
  profiles: Profile | null
  vote_count?: number
  user_has_voted?: boolean
  company_reply?: CompanyReplyWithVotes | null
}

export interface CompanyReplyWithVotes extends CompanyReply {
  vote_count?: number
  user_has_voted?: boolean
}

// Notification functions
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
};

export const getRecentNotifications = async (userId: string, limit: number = 5): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getRecentNotifications:', error);
    return [];
  }
};

export const getAllNotifications = async (userId: string, page: number = 1, pageSize: number = 20): Promise<{ notifications: Notification[]; totalCount: number }> => {
  try {
    const offset = (page - 1) * pageSize;

    // Get total count
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', userId);

    if (countError) {
      console.error('Error fetching notification count:', countError);
      throw countError;
    }

    // Get paginated notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_profile_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return {
      notifications: data || [],
      totalCount: count || 0
    };
  } catch (error: any) {
    console.error('Error in getAllNotifications:', error);
    return { notifications: [], totalCount: 0 };
  }
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_profile_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in markNotificationAsRead:', error);
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_profile_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return { success: false, error: error.message };
  }
};

export const createNotification = async (
  recipientId: string,
  type: string,
  message: string,
  linkUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_profile_id: recipientId,
        type,
        message,
        link_url: linkUrl || null,
        is_read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in createNotification:', error);
    return { success: false, error: error.message };
  }
};

// Utility functions for database operations
export const getCompanyCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase error in getCompanyCount:', error)
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error fetching company count:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return 0;
  }
};

export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    console.log('Attempting to fetch companies from:', supabaseUrl)
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in getAllCompanies:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error;
    }

    console.log('Successfully fetched companies:', data?.length || 0)
    return data || [];
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    
    // Provide more specific error information
    if (error.message?.includes('fetch')) {
      console.error('Network connectivity issue detected')
      console.error('Check:')
      console.error('1. Supabase URL:', supabaseUrl)
      console.error('2. Internet connectivity')
      console.error('3. Supabase project status')
      console.error('4. CORS settings in Supabase dashboard')
    }
    
    return [];
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error in getAllCategories:', error)
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return [];
  }
};

export const getCategoryCompanyCount = async (categoryId: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) {
      console.error('Supabase error in getCategoryCompanyCount:', error)
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error fetching category company count:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return 0;
  }
};

export const searchCompanies = async (query: string): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`name.ilike.%${query}%,domain_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in searchCompanies:', error)
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error searching companies:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return [];
  }
};

// New function to search companies using RPC with ratings
export const searchCompaniesWithRatings = async (query: string): Promise<CompanySearchResult[]> => {
  try {
    const { data, error } = await supabase.rpc('search_companies', {
      search_term: query.trim()
    });

    if (error) {
      console.error('Supabase error in searchCompaniesWithRatings:', error)
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error searching companies with ratings:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return [];
  }
};

export const getCompanyById = async (id: number): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Company not found
      }
      console.error('Supabase error in getCompanyById:', error)
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching company by ID:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return null;
  }
};

export const getCompanyWithCategoryById = async (id: number): Promise<CompanyWithCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*, categories(id, name, description)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Company not found
      }
      console.error('Supabase error in getCompanyWithCategoryById:', error)
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching company with category by ID:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return null;
  }
};

export const getReviewsByCompanyId = async (companyId: number, userId?: string): Promise<ReviewWithProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_profile_id_fkey(first_name, last_name, avatar_url)')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error in getReviewsByCompanyId:', error)
      throw error;
    }

    if (!data) return [];

    // Get company replies for all reviews
    const reviewIds = data.map(review => review.id);
    const { data: replies } = await supabase
      .from('company_replies')
      .select('*')
      .in('review_id', reviewIds);

    // If user is provided, get vote counts and user vote status for each review and reply
    if (userId) {
      const reviewsWithVotes = await Promise.all(
        data.map(async (review) => {
          // Get review vote count
          const { count: voteCount } = await supabase
            .from('review_votes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id);

          // Check if user has voted on review
          const { data: userVote } = await supabase
            .from('review_votes')
            .select('review_id')
            .eq('review_id', review.id)
            .eq('profile_id', userId)
            .limit(1);

          // Find company reply for this review
          const companyReply = replies?.find(reply => reply.review_id === review.id) || null;

          // If there's a reply, get its vote data
          let companyReplyWithVotes: CompanyReplyWithVotes | null = null;
          if (companyReply) {
            // Get reply vote count
            const { count: replyVoteCount } = await supabase
              .from('reply_votes')
              .select('*', { count: 'exact', head: true })
              .eq('reply_id', companyReply.id);

            // Check if user has voted on reply
            const { data: userReplyVote } = await supabase
              .from('reply_votes')
              .select('reply_id')
              .eq('reply_id', companyReply.id)
              .eq('profile_id', userId)
              .limit(1);

            companyReplyWithVotes = {
              ...companyReply,
              vote_count: replyVoteCount || 0,
              user_has_voted: userReplyVote && userReplyVote.length > 0
            };
          }

          return {
            ...review,
            vote_count: voteCount || 0,
            user_has_voted: userVote && userVote.length > 0,
            company_reply: companyReplyWithVotes
          };
        })
      );

      return reviewsWithVotes;
    }

    // If no user, just get vote counts and replies
    const reviewsWithVotes = await Promise.all(
      data.map(async (review) => {
        const { count: voteCount } = await supabase
          .from('review_votes')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', review.id);

        // Find company reply for this review
        const companyReply = replies?.find(reply => reply.review_id === review.id) || null;

        // If there's a reply, get its vote count
        let companyReplyWithVotes: CompanyReplyWithVotes | null = null;
        if (companyReply) {
          const { count: replyVoteCount } = await supabase
            .from('reply_votes')
            .select('*', { count: 'exact', head: true })
            .eq('reply_id', companyReply.id);

          companyReplyWithVotes = {
            ...companyReply,
            vote_count: replyVoteCount || 0,
            user_has_voted: false
          };
        }

        return {
          ...review,
          vote_count: voteCount || 0,
          user_has_voted: false,
          company_reply: companyReplyWithVotes
        };
      })
    );

    return reviewsWithVotes;
  } catch (error: any) {
    console.error('Error fetching reviews by company ID:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return [];
  }
};

// Review vote functions
export const toggleReviewVote = async (reviewId: number, userId: string): Promise<{ success: boolean; isVoted: boolean; voteCount: number }> => {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('review_votes')
      .select('review_id, profile_id')
      .eq('review_id', reviewId)
      .eq('profile_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Supabase error in toggleReviewVote (check):', checkError)
      throw checkError;
    }

    if (existingVote && existingVote.length > 0) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('review_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Supabase error in toggleReviewVote (delete):', deleteError)
        throw deleteError;
      }

      // Get updated vote count
      const { count: voteCount } = await supabase
        .from('review_votes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      return { success: true, isVoted: false, voteCount: voteCount || 0 };
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('review_votes')
        .insert([{ review_id: reviewId, profile_id: userId }]);

      if (insertError) {
        console.error('Supabase error in toggleReviewVote (insert):', insertError)
        throw insertError;
      }

      // Get updated vote count
      const { count: voteCount } = await supabase
        .from('review_votes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      return { success: true, isVoted: true, voteCount: voteCount || 0 };
    }
  } catch (error: any) {
    console.error('Error toggling review vote:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, isVoted: false, voteCount: 0 };
  }
};

// Reply vote functions
export const toggleReplyVote = async (replyId: string, userId: string): Promise<{ success: boolean; isVoted: boolean; voteCount: number }> => {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('reply_votes')
      .select('reply_id, profile_id')
      .eq('reply_id', replyId)
      .eq('profile_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Supabase error in toggleReplyVote (check):', checkError)
      throw checkError;
    }

    if (existingVote && existingVote.length > 0) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('reply_votes')
        .delete()
        .eq('reply_id', replyId)
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Supabase error in toggleReplyVote (delete):', deleteError)
        throw deleteError;
      }

      // Get updated vote count
      const { count: voteCount } = await supabase
        .from('reply_votes')
        .select('*', { count: 'exact', head: true })
        .eq('reply_id', replyId);

      return { success: true, isVoted: false, voteCount: voteCount || 0 };
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('reply_votes')
        .insert([{ reply_id: replyId, profile_id: userId }]);

      if (insertError) {
        console.error('Supabase error in toggleReplyVote (insert):', insertError)
        throw insertError;
      }

      // Get updated vote count
      const { count: voteCount } = await supabase
        .from('reply_votes')
        .select('*', { count: 'exact', head: true })
        .eq('reply_id', replyId);

      return { success: true, isVoted: true, voteCount: voteCount || 0 };
    }
  } catch (error: any) {
    console.error('Error toggling reply vote:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, isVoted: false, voteCount: 0 };
  }
};

// Updated report functions using RPC calls
export const submitReport = async (
  reviewId: number, 
  reporterUserId: string, 
  reason: string, 
  details?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('handle_new_review_report', {
      p_review_id: reviewId,
      p_reporter_profile_id: reporterUserId,
      p_reason: reason,
      p_details: details || null
    });

    if (error) {
      console.error('Supabase error in submitReport:', error)
      throw error;
    }

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error submitting report:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, error: error.message };
  }
};

// Reply report functions using RPC calls
export const submitReplyReport = async (
  replyId: string, 
  reporterUserId: string, 
  reason: string, 
  details?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('handle_new_reply_report', {
      p_reply_id: replyId,
      p_reporter_profile_id: reporterUserId,
      p_reason: reason,
      p_details: details || null
    });

    if (error) {
      console.error('Supabase error in submitReplyReport:', error)
      throw error;
    }

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error submitting reply report:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, error: error.message };
  }
};

// Company representative functions
export const isCompanyRepresentative = async (companyId: number, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('company_representatives')
      .select('company_id')
      .eq('company_id', companyId)
      .eq('profile_id', userId)
      .limit(1);

    if (error) {
      console.error('Supabase error in isCompanyRepresentative:', error)
      throw error;
    }

    return data && data.length > 0;
  } catch (error: any) {
    console.error('Error checking company representative:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return false;
  }
};

// Company reply functions
export const submitCompanyReply = async (
  reviewId: number,
  replyBody: string,
  userId: string
): Promise<{ success: boolean; error?: string; reply?: CompanyReply }> => {
  try {
    const { data, error } = await supabase
      .from('company_replies')
      .insert([{
        review_id: reviewId,
        reply_body: replyBody,
        profile_id: userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error in submitCompanyReply:', error)
      throw error;
    }

    return { success: true, reply: data };
  } catch (error: any) {
    console.error('Error submitting company reply:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, error: error.message };
  }
};

// Company claiming functions
export const claimCompany = async (companyId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('companies')
      .update({ is_claimed: true })
      .eq('id', companyId);

    if (error) {
      console.error('Supabase error in claimCompany:', error)
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error claiming company:', error);
    if (error.message?.includes('fetch')) {
      console.error('Network error - check Supabase URL and connectivity')
    }
    return { success: false, error: error.message };
  }
};