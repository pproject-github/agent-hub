import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/AuthContext.jsx';
import FlowCard from '../components/FlowCard.jsx';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    fetchData();
  }, [user, navigate]);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('flows')
      .select('*, profiles!flows_author_id_fkey(username, avatar_url)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setFlows(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse-slow">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
        ) : (
          <span className="material-symbols-outlined text-5xl text-primary">account_circle</span>
        )}
        <div>
          <h1 className="font-headline font-bold text-2xl">{profile?.username}</h1>
          <p className="text-on-surface-variant text-sm">{user?.email}</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-bold text-xl">{t('profile.myFlows')}</h2>
          <Link to="/publish" className="btn-primary btn-sm">{t('nav.publish')}</Link>
        </div>
        {flows.length === 0 ? (
          <p className="text-on-surface-variant">{t('profile.noFlows')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {flows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
