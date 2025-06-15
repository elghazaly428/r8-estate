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

// Enhanced error handling function
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase error in ${operation}:`, error);
  
  if (error.message?.includes('fetch')) {
    console.error('Network connectivity issue detected');
    console.error('Troubleshooting steps:');
    console.error('1. Check Supabase URL:', supabaseUrl);
    console.error('2. Verify internet connectivity');
    console.error('3. Check Supabase project status at https://status.supabase.com/');
    console.error('4. Verify CORS settings in Supabase dashboard');
    console.error('5. Ensure localhost:5173 is added to allowed origins');
  }
  
  if (error.code) {
    console.error('Error code:', error.code);
  }
  
  if (error.details) {
    console.error('Error details:', error.details);
  }
  
  if (error.hint) {
    console.error('Error hint:', error.hint);
  }
};

// Notification functions with enhanced error handling
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    console.log('Fetching unread notification count for user:', userId);
    console.log('Using Supabase URL:', supabaseUrl);
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', userId)
      .eq('is_read', false);

    if (error) {
      handleSupabaseError(error, 'getUnreadNotificationCount');
      throw error;
    }

    console.log('Successfully fetched unread notification count:', count);
    return count || 0;
  } catch (error: any) {
    console.error('Error in getUnreadNotificationCount:', error);
    handleSupabaseError(error, 'getUnreadNotificationCount');
    return 0;
  }
};

export const getRecentNotifications = async (userId: string, limit: number = 5): Promise<Notification[]> => {
  try {
    console.log('Fetching recent notifications for user:', userId, 'limit:', limit);
    console.log('Using Supabase URL:', supabaseUrl);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      handleSupabaseError(error, 'getRecentNotifications');
      throw error;
    }

    console.log('Successfully fetched recent notifications:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('Error in getRecentNotifications:', error);
    handleSupabaseError(error, 'getRecentNotifications');
    return [];
  }
};

export const getAllNotifications = async (userId: string, page: number = 1, pageSize: number = 20): Promise<{ notifications: Notification[]; totalCount: number }> => {
  try {
    console.log('Fetching all notifications for user:', userId, 'page:', page, 'pageSize:', pageSize);
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Environment check - URL exists:', !!supabaseUrl, 'Key exists:', !!supabaseAnonKey);
    
    const offset = (page - 1) * pageSize;

    // Test connection first
    console.log('Testing Supabase connection...');
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.error('Connection test failed:', connectionTest.error);
      throw new Error(`Connection failed: ${connectionTest.error}`);
    }
    console.log('Connection test passed');

    // Get total count
    console.log('Fetching notification count...');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', userId);

    if (countError) {
      handleSupabaseError(countError, 'getAllNotifications (count)');
      throw countError;
    }

    console.log('Total notification count:', count);

    // Get paginated notifications
    console.log('Fetching paginated notifications...');
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_profile_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      handleSupabaseError(error, 'getAllNotifications (data)');
      throw error;
    }

    console.log('Successfully fetched notifications:', data?.length || 0);
    return {
      notifications: data || [],
      totalCount: count || 0
    };
  } catch (error: any) {
    console.error('Error in getAllNotifications:', error);
    handleSupabaseError(error, 'getAllNotifications');
    return { notifications: [], totalCount: 0 };
  }
};

export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Marking notification as read:', notificationId, 'for user:', userId);
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_profile_id', userId);

    if (error) {
      handleSupabaseError(error, 'markNotificationAsRead');
      return { success: false, error: error.message };
    }

    console.log('Successfully marked notification as read');
    return { success: true };
  } catch (error: any) {
    console.error('Error in markNotificationAsRead:', error);
    handleSupabaseError(error, 'markNotificationAsRead');
    return { success: false, error: error.message };
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Marking all notifications as read for user:', userId);
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_profile_id', userId)
      .eq('is_read', false);

    if (error) {
      handleSupabaseError(error, 'markAllNotificationsAsRead');
      return { success: false, error: error.message };
    }

    console.log('Successfully marked all notifications as read');
    return { success: true };
  } catch (error: any) {
    console.error('Error in markAllNotificationsAsRead:', error);
    handleSupabaseError(error, 'markAllNotificationsAsRead');
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
    console.log('Creating notification for user:', recipientId, 'type:', type);
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_profile_id: recipientId,
        message,
        link_url: linkUrl || null,
        is_read: false
      });

    if (error) {
      handleSupabaseError(error, 'createNotification');
      return { success: false, error: error.message };
    }

    console.log('Successfully created notification');
    return { success: true };
  } catch (error: any) {
    console.error('Error in createNotification:', error);
    handleSupabaseError(error, 'createNotification');
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
      handleSupabaseError(error, 'getCompanyCount');
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error fetching company count:', error);
    handleSupabaseError(error, 'getCompanyCount');
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
      handleSupabaseError(error, 'getAllCompanies');
      throw error;
    }

    console.log('Successfully fetched companies:', data?.length || 0)
    return data || [];
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    handleSupabaseError(error, 'getAllCompanies');
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
      handleSupabaseError(error, 'getAllCategories');
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    handleSupabaseError(error, 'getAllCategories');
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
      handleSupabaseError(error, 'getCategoryCompanyCount');
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error fetching category company count:', error);
    handleSupabaseError(error, 'getCategoryCompanyCount');
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
      handleSupabaseError(error, 'searchCompanies');
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error searching companies:', error);
    handleSupabaseError(error, 'searchCompanies');
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
      handleSupabaseError(error, 'searchCompaniesWithRatings');
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error searching companies with ratings:', error);
    handleSupabaseError(error, 'searchCompaniesWithRatings');
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
      handleSupabaseError(error, 'getCompanyById');
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching company by ID:', error);
    handleSupabaseError(error, 'getCompanyById');
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
      handleSupabaseError(error, 'getCompanyWithCategoryById');
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching company with category by ID:', error);
    handleSupabaseError(error, 'getCompanyWithCategoryById');
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
      handleSupabaseError(error, 'getReviewsByCompanyId');
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
    handleSupabaseError(error, 'getReviewsByCompanyId');
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
      handleSupabaseError(checkError, 'toggleReviewVote (check)');
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
        handleSupabaseError(deleteError, 'toggleReviewVote (delete)');
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
        handleSupabaseError(insertError, 'toggleReviewVote (insert)');
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
    handleSupabaseError(error, 'toggleReviewVote');
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
      handleSupabaseError(checkError, 'toggleReplyVote (check)');
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
        handleSupabaseError(deleteError, 'toggleReplyVote (delete)');
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
        handleSupabaseError(insertError, 'toggleReplyVote (insert)');
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
    handleSupabaseError(error, 'toggleReplyVote');
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
      handleSupabaseError(error, 'submitReport');
      throw error;
    }

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error submitting report:', error);
    handleSupabaseError(error, 'submitReport');
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
      handleSupabaseError(error, 'submitReplyReport');
      throw error;
    }

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error submitting reply report:', error);
    handleSupabaseError(error, 'submitReplyReport');
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
      handleSupabaseError(error, 'isCompanyRepresentative');
      throw error;
    }

    return data && data.length > 0;
  } catch (error: any) {
    console.error('Error checking company representative:', error);
    handleSupabaseError(error, 'isCompanyRepresentative');
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
      handleSupabaseError(error, 'submitCompanyReply');
      throw error;
    }

    return { success: true, reply: data };
  } catch (error: any) {
    console.error('Error submitting company reply:', error);
    handleSupabaseError(error, 'submitCompanyReply');
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
      handleSupabaseError(error, 'claimCompany');
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error claiming company:', error);
    handleSupabaseError(error, 'claimCompany');
    return { success: false, error: error.message };
  }
};