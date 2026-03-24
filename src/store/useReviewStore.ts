import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface TradeReview {
  id: string;
  identityId: string;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  lessons: string;
  goals: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export function useReviewStore(user: User, identityId: string) {
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!identityId) return;
    setLoading(true);
    const { data } = await supabase
      .from('trade_reviews')
      .select('*')
      .eq('identity_id', identityId)
      .order('period_start', { ascending: false });

    setReviews(
      (data ?? []).map((r: any) => ({
        id: r.id,
        identityId: r.identity_id,
        periodType: r.period_type,
        periodLabel: r.period_label,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        summary: r.summary,
        lessons: r.lessons,
        goals: r.goals,
        rating: r.rating,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
    );
    setLoading(false);
  }, [identityId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const addReview = useCallback(async (review: Omit<TradeReview, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await supabase.from('trade_reviews').insert({
      user_id: user.id,
      identity_id: review.identityId,
      period_type: review.periodType,
      period_label: review.periodLabel,
      period_start: review.periodStart,
      period_end: review.periodEnd,
      summary: review.summary,
      lessons: review.lessons,
      goals: review.goals,
      rating: review.rating,
    }).select().single();

    if (data) {
      const newReview: TradeReview = {
        id: data.id, identityId: data.identity_id, periodType: data.period_type as any,
        periodLabel: data.period_label, periodStart: data.period_start, periodEnd: data.period_end,
        summary: data.summary, lessons: data.lessons, goals: data.goals, rating: data.rating,
        createdAt: data.created_at, updatedAt: data.updated_at,
      };
      setReviews(prev => [newReview, ...prev]);
    }
  }, [user.id]);

  const updateReview = useCallback(async (id: string, updates: Partial<Pick<TradeReview, 'summary' | 'lessons' | 'goals' | 'rating'>>) => {
    await supabase.from('trade_reviews').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
  }, []);

  const deleteReview = useCallback(async (id: string) => {
    await supabase.from('trade_reviews').delete().eq('id', id);
    setReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  return { reviews, loading, addReview, updateReview, deleteReview };
}
