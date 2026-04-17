import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';
import FlowCard from '../components/FlowCard.jsx';

const PAGE_SIZE = 12;

export default function Home() {
  const { t } = useTranslation();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(0);

  const fetchFlows = useCallback(async (pageNum, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('flows')
      .select('*, profiles!flows_author_id_fkey(username, avatar_url)')
      .eq('published', true);

    if (sort === 'popular') {
      query = query.order('downloads', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);
    const { data, error } = await query;

    if (!error) {
      const newData = data || [];
      setFlows((prev) => append ? [...prev, ...newData] : newData);
      setHasMore(newData.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [sort]);

  useEffect(() => {
    setPage(0);
    setFlows([]);
    setHasMore(true);
    fetchFlows(0, false);
  }, [sort, fetchFlows]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchFlows(next, true);
  }

  const filtered = search
    ? flows.filter(
        (f) =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.description?.toLowerCase().includes(search.toLowerCase()) ||
          f.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : flows;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-16">
      <div className="text-center mb-12">
        <h1 className="font-headline font-bold text-4xl md:text-6xl mb-4">
          {t('home.title')} <span className="text-gradient">{t('home.titleGradient')}</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder={t('home.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSort('popular')}
            className={`btn-ghost btn-sm ${sort === 'popular' ? 'border-primary text-primary' : ''}`}
          >
            {t('home.sort.popular')}
          </button>
          <button
            onClick={() => setSort('trending')}
            className={`btn-ghost btn-sm ${sort === 'trending' ? 'border-primary text-primary' : ''}`}
          >
            {t('home.sort.trending')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl animate-pulse-slow">hourglass_empty</span>
          <p className="mt-4">{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl">search_off</span>
          <p className="mt-4">{t('home.noResults')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>

          {hasMore && !search && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-ghost"
              >
                {loadingMore ? t('common.loading') : t('home.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
