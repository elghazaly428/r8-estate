import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface Category {
  id: number;
  name: string | null;
  description: string | null;
  icon_name: string | null;
  created_at: string;
}

export interface Company {
  id: number;
  created_at: string;
  name: string | null;
  logo_url: string | null;
  website: string | null;
  domain_name: string | null;
  is_claimed: boolean | null;
  category_id: number | null;
  established_in: number | null;
  location: string | null;
  description: string | null;
}

export interface CompanyWithCategory extends Company {
  categories: Category | null;
}

export interface CompanySearchResult extends CompanyWithCategory {
  average_rating: number;
  review_count: number;
}

export interface Review {
  id: number;
  created_at: string;
  profile_id: string | null;
  company_id: number | null;
  title: string | null;
  body: string | null;
  rating_communication: number | null;
  rating_responsiveness: number | null;
  rating_value: number | null;
  rating_friendliness: number | null;
  overall_rating: number | null;
  date_of_experience: string | null;
  has_document: boolean | null;
  is_anonymous: boolean | null;
  status: string | null;
}

export interface CompanyReply {
  id: number;
  created_at: string;
  reply_body: string | null;
  review_id: number | null;
  profile_id: string | null;
  status: string | null;
}

export interface CompanyReplyWithVotes extends CompanyReply {
  vote_count: number;
  user_has_voted: boolean;
}

export interface ReviewWithProfile extends Review {
  profiles: Profile | null;
  vote_count: number;
  user_has_voted: boolean;
  company_reply: CompanyReplyWithVotes | null;
}

// Get all categories
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return [];
  }
};

// Get all companies
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCompanies:', error);
    return [];
  }
};

// Get company by ID
export const getCompanyById = async (id: number): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCompanyById:', error);
    return null;
  }
};

// Get company with category by ID
export const getCompanyWithCategoryById = async (id: number): Promise<CompanyWithCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*, categories(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company with category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getCompanyWithCategoryById:', error);
    return null;
  }
};

// Search companies
export const searchCompanies = async (query: string, categoryId?: number): Promise<CompanySearchResult[]> => {
  try {
    let queryBuilder = supabase
      .from('companies')
      .select('*, categories(*)');

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    if (categoryId) {
      queryBuilder = queryBuilder.eq('category_id', categoryId);
    }

    const { data, error } = await queryBuilder.order('name');

    if (error) {
      console.error('Error searching companies:', error);
      throw error;
    }

    if (!data) return [];

    // Get ratings for each company
    const companiesWithRatings = await Promise.all(
      data.map(async (company) => {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('overall_rating')
          .eq('company_id', company.id)
          .eq('status', 'published');

        const validRatings = reviews?.filter(r => r.overall_rating !== null) || [];
        const averageRating = validRatings.length > 0 
          ? validRatings.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / validRatings.length
          : 0;

        return {
          ...company,
          average_rating: Math.round(averageRating * 10) / 10,
          review_count: reviews?.length || 0
        };
      })
    );

    return companiesWithRatings;
  } catch (error) {
    console.error('Error in searchCompanies:', error);
    return [];
  }
};

// Search companies with ratings (alias for searchCompanies)
export const searchCompaniesWithRatings = searchCompanies;

// Get category company count
export const getCategoryCompanyCount = async (categoryId: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error getting category company count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getCategoryCompanyCount:', error);
    return 0;
  }
};

// Toggle review vote
export const toggleReviewVote = async (reviewId: number, userId: string): Promise<{ success: boolean; voteCount: number; isVoted: boolean }> => {
  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('*')
      .eq('review_id', reviewId)
      .eq('profile_id', userId)
      .single();

    if (existingVote) {
      // Remove vote
      const { error } = await supabase
        .from('review_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('profile_id', userId);

      if (error) throw error;
    } else {
      // Add vote
      const { error } = await supabase
        .from('review_votes')
        .insert({ review_id: reviewId, profile_id: userId });

      if (error) throw error;
    }

    // Get updated vote count
    const { count } = await supabase
      .from('review_votes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    return {
      success: true,
      voteCount: count || 0,
      isVoted: !existingVote
    };
  } catch (error) {
    console.error('Error toggling review vote:', error);
    return { success: false, voteCount: 0, isVoted: false };
  }
};

// Toggle reply vote
export const toggleReplyVote = async (replyId: string, userId: string): Promise<{ success: boolean; voteCount: number; isVoted: boolean }> => {
  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('reply_votes')
      .select('*')
      .eq('reply_id', replyId)
      .eq('profile_id', userId)
      .single();

    if (existingVote) {
      // Remove vote
      const { error } = await supabase
        .from('reply_votes')
        .delete()
        .eq('reply_id', replyId)
        .eq('profile_id', userId);

      if (error) throw error;
    } else {
      // Add vote
      const { error } = await supabase
        .from('reply_votes')
        .insert({ reply_id: replyId, profile_id: userId });

      if (error) throw error;
    }

    // Get updated vote count
    const { count } = await supabase
      .from('reply_votes')
      .select('*', { count: 'exact', head: true })
      .eq('reply_id', replyId);

    return {
      success: true,
      voteCount: count || 0,
      isVoted: !existingVote
    };
  } catch (error) {
    console.error('Error toggling reply vote:', error);
    return { success: false, voteCount: 0, isVoted: false };
  }
};

// Submit report
export const submitReport = async (reviewId: number, reporterId: string, reason: string, details?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('reports')
      .insert({
        review_id: reviewId,
        reporter_profile_id: reporterId,
        reason,
        details: details || null,
        status: 'received'
      });

    if (error) {
      console.error('Error submitting report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitReport:', error);
    return { success: false, error: error.message };
  }
};

// Submit reply report
export const submitReplyReport = async (replyId: string, reporterId: string, reason: string, details?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('reply_reports')
      .insert({
        reply_id: replyId,
        reporter_profile_id: reporterId,
        reason,
        details: details || null,
        status: 'received'
      });

    if (error) {
      console.error('Error submitting reply report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitReplyReport:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is company representative
export const isCompanyRepresentative = async (companyId: number, userId: string): Promise<boolean> => {
  try {
    // Validate inputs
    if (!companyId || !userId) {
      console.error('Invalid parameters for isCompanyRepresentative:', { companyId, userId });
      return false;
    }

    // Check if Supabase client is properly initialized
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { data, error } = await supabase
      .from('company_representatives')
      .select('*')
      .eq('company_id', companyId)
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking company representative:', error);
      // If it's a network error, log additional details
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.error('Network error details:', {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
      }
      return false;
    }

    return !!data;
  } catch (error: any) {
    console.error('Error in isCompanyRepresentative:', error);
    // Log additional context for debugging
    console.error('Function called with:', { companyId, userId });
    console.error('Environment check:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Available' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Available' : 'Missing'
    });
    return false;
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