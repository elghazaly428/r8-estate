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

export { getReviewsByCompanyId }