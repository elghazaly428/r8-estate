import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_suspended: boolean
  updated_at: string
}

export interface Company {
  id: number
  name: string | null
  logo_url: string | null
  website: string | null
  domain_name: string | null
  is_claimed: boolean | null
  category_id: number | null
  established_in: number | null
  location: string | null
  description: string | null
  created_at: string
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

export interface CompanyReply {
  id: number
  created_at: string
  reply_body: string | null
  review_id: number | null
  profile_id: string | null
  status: string | null
}

export interface Notification {
  id: number
  created_at: string
  recipient_profile_id: string | null
  message: string | null
  link_url: string | null
  is_read: boolean | null
  notification_type: string | null
  type: string | null
}

export interface CompanySearchResult {
  id: number
  name: string
  logo_url: string | null
  website: string | null
  location: string | null
  description: string | null
  category_name: string | null
  average_rating: number | null
  review_count: number
  is_claimed: boolean | null
}

// Company search function
export const searchCompaniesWithRatings = async (searchTerm: string): Promise<CompanySearchResult[]> => {
  try {
    // Search companies by name, description, or location
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        logo_url,
        website,
        location,
        description,
        is_claimed,
        categories!companies_category_id_fkey(name)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      console.error('Supabase error in searchCompaniesWithRatings:', error);
      throw error;
    }

    if (!companies || companies.length === 0) {
      return [];
    }

    // Get review statistics for each company
    const companyIds = companies.map(company => company.id);
    const { data: reviewStats, error: reviewError } = await supabase
      .from('reviews')
      .select('company_id, overall_rating')
      .in('company_id', companyIds)
      .eq('status', 'published');

    if (reviewError) {
      console.error('Supabase error fetching review stats:', reviewError);
      throw reviewError;
    }

    // Calculate average ratings and review counts
    const companyStats = companyIds.map(companyId => {
      const companyReviews = reviewStats?.filter(review => review.company_id === companyId) || [];
      const validRatings = companyReviews
        .map(review => review.overall_rating)
        .filter(rating => rating !== null && rating !== undefined) as number[];
      
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length 
        : null;
      
      return {
        companyId,
        averageRating,
        reviewCount: companyReviews.length
      };
    });

    // Combine company data with review statistics
    const results: CompanySearchResult[] = companies.map(company => {
      const stats = companyStats.find(stat => stat.companyId === company.id);
      return {
        id: company.id,
        name: company.name || '',
        logo_url: company.logo_url,
        website: company.website,
        location: company.location,
        description: company.description,
        category_name: company.categories?.name || null,
        average_rating: stats?.averageRating || null,
        review_count: stats?.reviewCount || 0,
        is_claimed: company.is_claimed
      };
    });

    return results;
  } catch (error: any) {
    console.error('Error searching companies with ratings:', error);
    return [];
  }
};

// Review vote functions - Updated to handle both helpful and not_helpful votes
export const toggleReviewVote = async (
  reviewId: number, 
  userId: string,
  voteType: 'helpful' | 'not_helpful'
): Promise<{ success: boolean; helpfulCount: number; notHelpfulCount: number; userVote: 'helpful' | 'not_helpful' | null }> => {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('review_votes')
      .select('vote_type')
      .eq('review_id', reviewId)
      .eq('profile_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Supabase error in toggleReviewVote (check):', checkError)
      throw checkError;
    }

    const currentVote = existingVote && existingVote.length > 0 ? existingVote[0].vote_type : null;

    if (currentVote === voteType) {
      // User is clicking the same vote type - remove the vote
      const { error: deleteError } = await supabase
        .from('review_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Supabase error in toggleReviewVote (delete):', deleteError)
        throw deleteError;
      }
    } else if (currentVote && currentVote !== voteType) {
      // User is switching vote type - update the existing vote
      const { error: updateError } = await supabase
        .from('review_votes')
        .update({ vote_type: voteType })
        .eq('review_id', reviewId)
        .eq('profile_id', userId);

      if (updateError) {
        console.error('Supabase error in toggleReviewVote (update):', updateError)
        throw updateError;
      }
    } else {
      // User has no vote - insert new vote
      const { error: insertError } = await supabase
        .from('review_votes')
        .insert([{ 
          review_id: reviewId, 
          profile_id: userId, 
          vote_type: voteType
        }]);

      if (insertError) {
        console.error('Supabase error in toggleReviewVote (insert):', insertError)
        throw insertError;
      }
    }

    // Get updated vote counts and user's current vote
    const { data: allVotes } = await supabase
      .from('review_votes')
      .select('vote_type, profile_id')
      .eq('review_id', reviewId);

    const helpfulCount = allVotes?.filter(v => v.vote_type === 'helpful').length || 0;
    const notHelpfulCount = allVotes?.filter(v => v.vote_type === 'not_helpful').length || 0;
    const userVote = allVotes?.find(v => v.profile_id === userId)?.vote_type || null;

    return { 
      success: true, 
      helpfulCount,
      notHelpfulCount,
      userVote
    };
  } catch (error: any) {
    console.error('Error toggling review vote:', error);
    return { 
      success: false, 
      helpfulCount: 0, 
      notHelpfulCount: 0,
      userVote: null
    };
  }
};

// Reply vote functions - Updated to handle both helpful and not_helpful votes
export const toggleReplyVote = async (
  replyId: string, 
  userId: string,
  voteType: 'helpful' | 'not_helpful'
): Promise<{ success: boolean; helpfulCount: number; notHelpfulCount: number; userVote: 'helpful' | 'not_helpful' | null }> => {
  try {
    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('reply_votes')
      .select('vote_type')
      .eq('reply_id', replyId)
      .eq('profile_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Supabase error in toggleReplyVote (check):', checkError)
      throw checkError;
    }

    const currentVote = existingVote && existingVote.length > 0 ? existingVote[0].vote_type : null;

    if (currentVote === voteType) {
      // User is clicking the same vote type - remove the vote
      const { error: deleteError } = await supabase
        .from('reply_votes')
        .delete()
        .eq('reply_id', replyId)
        .eq('profile_id', userId);

      if (deleteError) {
        console.error('Supabase error in toggleReplyVote (delete):', deleteError)
        throw deleteError;
      }
    } else if (currentVote && currentVote !== voteType) {
      // User is switching vote type - update the existing vote
      const { error: updateError } = await supabase
        .from('reply_votes')
        .update({ vote_type: voteType })
        .eq('reply_id', replyId)
        .eq('profile_id', userId);

      if (updateError) {
        console.error('Supabase error in toggleReplyVote (update):', updateError)
        throw updateError;
      }
    } else {
      // User has no vote - insert new vote
      const { error: insertError } = await supabase
        .from('reply_votes')
        .insert([{ 
          reply_id: replyId, 
          profile_id: userId, 
          vote_type: voteType
        }]);

      if (insertError) {
        console.error('Supabase error in toggleReplyVote (insert):', insertError)
        throw insertError;
      }
    }

    // Get updated vote counts and user's current vote
    const { data: allVotes } = await supabase
      .from('reply_votes')
      .select('vote_type, profile_id')
      .eq('reply_id', replyId);

    const helpfulCount = allVotes?.filter(v => v.vote_type === 'helpful').length || 0;
    const notHelpfulCount = allVotes?.filter(v => v.vote_type === 'not_helpful').length || 0;
    const userVote = allVotes?.find(v => v.profile_id === userId)?.vote_type || null;

    return { 
      success: true, 
      helpfulCount,
      notHelpfulCount,
      userVote
    };
  } catch (error: any) {
    console.error('Error toggling reply vote:', error);
    return { 
      success: false, 
      helpfulCount: 0, 
      notHelpfulCount: 0,
      userVote: null
    };
  }
};

// Notification functions
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_profile_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Supabase error in getUnreadNotificationCount:', error);
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
};

export const getRecentNotifications = async (userId: string, limit: number = 10): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error in getRecentNotifications:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching recent notifications:', error);
    return [];
  }
};

// Updated interfaces to support new vote structure
export interface ReviewWithProfile extends Review {
  profiles: Profile | null
  helpful_count?: number
  not_helpful_count?: number
  user_vote?: 'helpful' | 'not_helpful' | null
  company_reply?: CompanyReplyWithVotes | null
}

export interface CompanyReplyWithVotes extends CompanyReply {
  helpful_count?: number
  not_helpful_count?: number
  user_vote?: 'helpful' | 'not_helpful' | null
}

// Updated function to get reviews with new vote structure
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
          // Get review vote counts and user vote
          const { data: votes } = await supabase
            .from('review_votes')
            .select('vote_type, profile_id')
            .eq('review_id', review.id);

          const helpfulCount = votes?.filter(v => v.vote_type === 'helpful').length || 0;
          const notHelpfulCount = votes?.filter(v => v.vote_type === 'not_helpful').length || 0;
          const userVote = votes?.find(v => v.profile_id === userId)?.vote_type || null;

          // Find company reply for this review
          const companyReply = replies?.find(reply => reply.review_id === review.id) || null;

          // If there's a reply, get its vote data
          let companyReplyWithVotes: CompanyReplyWithVotes | null = null;
          if (companyReply) {
            // Get reply vote counts and user vote
            const { data: replyVotes } = await supabase
              .from('reply_votes')
              .select('vote_type, profile_id')
              .eq('reply_id', companyReply.id);

            const replyHelpfulCount = replyVotes?.filter(v => v.vote_type === 'helpful').length || 0;
            const replyNotHelpfulCount = replyVotes?.filter(v => v.vote_type === 'not_helpful').length || 0;
            const replyUserVote = replyVotes?.find(v => v.profile_id === userId)?.vote_type || null;

            companyReplyWithVotes = {
              ...companyReply,
              helpful_count: replyHelpfulCount,
              not_helpful_count: replyNotHelpfulCount,
              user_vote: replyUserVote
            };
          }

          return {
            ...review,
            helpful_count: helpfulCount,
            not_helpful_count: notHelpfulCount,
            user_vote: userVote,
            company_reply: companyReplyWithVotes
          };
        })
      );

      return reviewsWithVotes;
    }

    // If no user, just get vote counts
    const reviewsWithVotes = await Promise.all(
      data.map(async (review) => {
        // Get review vote counts
        const { data: votes } = await supabase
          .from('review_votes')
          .select('vote_type')
          .eq('review_id', review.id);

        const helpfulCount = votes?.filter(v => v.vote_type === 'helpful').length || 0;
        const notHelpfulCount = votes?.filter(v => v.vote_type === 'not_helpful').length || 0;

        // Find company reply for this review
        const companyReply = replies?.find(reply => reply.review_id === review.id) || null;

        // If there's a reply, get its vote counts
        let companyReplyWithVotes: CompanyReplyWithVotes | null = null;
        if (companyReply) {
          const { data: replyVotes } = await supabase
            .from('reply_votes')
            .select('vote_type')
            .eq('reply_id', companyReply.id);

          const replyHelpfulCount = replyVotes?.filter(v => v.vote_type === 'helpful').length || 0;
          const replyNotHelpfulCount = replyVotes?.filter(v => v.vote_type === 'not_helpful').length || 0;

          companyReplyWithVotes = {
            ...companyReply,
            helpful_count: replyHelpfulCount,
            not_helpful_count: replyNotHelpfulCount,
            user_vote: null
          };
        }

        return {
          ...review,
          helpful_count: helpfulCount,
          not_helpful_count: notHelpfulCount,
          user_vote: null,
          company_reply: companyReplyWithVotes
        };
      })
    );

    return reviewsWithVotes;
  } catch (error: any) {
    console.error('Error fetching reviews by company ID:', error);
    return [];
  }
};