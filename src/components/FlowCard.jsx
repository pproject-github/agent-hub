import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FlowCard({ flow }) {
  const { t } = useTranslation();

  return (
    <Link to={`/flows/${flow.slug}`} className="card-solid group cursor-pointer block">
      {flow.thumbnail_key && (
        <div className="mb-4 rounded-2xl overflow-hidden bg-surface-container-lowest h-40 flex items-center justify-center">
          <img src={flow.thumbnail_key} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors mb-2">
        {flow.title}
      </h3>
      {flow.description && (
        <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">
          {flow.description}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {flow.tags?.map((tag) => (
          <span key={tag} className="badge-tag">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">person</span>
          <span>{flow.profiles?.username || 'anonymous'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span>
            {flow.downloads}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">chat_bubble_outline</span>
            {flow.comments_count}
          </span>
          {flow.node_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">account_tree</span>
              {flow.node_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
