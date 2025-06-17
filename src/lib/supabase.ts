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