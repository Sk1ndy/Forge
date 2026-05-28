import { useState, useEffect } from 'react';
// Import your supabase client here when ready
// import { supabase } from '@/lib/supabase';

interface SubscriptionData {
  tier: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'none';
  isPro: boolean;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionData {
  const [subData, setSubData] = useState<SubscriptionData>({
    tier: 'free',
    status: 'none',
    isPro: false, // Set to false by default to test the Paywall
    isLoading: true,
  });

  useEffect(() => {
    // TODO: Fetch from Supabase `subscriptions` table
    /*
    async function fetchSub() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setSubData(prev => ({ ...prev, isLoading: false }));
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setSubData({
          tier: data.tier,
          status: data.status,
          isPro: data.tier === 'pro' && data.status === 'active',
          isLoading: false
        });
      } else {
        setSubData(prev => ({ ...prev, isLoading: false }));
      }
    }
    fetchSub();
    */

    // Mocking API call
    const timer = setTimeout(() => {
      setSubData((prev) => ({ ...prev, isLoading: false }));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return subData;
}
