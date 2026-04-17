import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/AuthContext.jsx';
import JSZip from 'jszip';
import FlowViewer from '../components/FlowViewer.jsx';

export default function FlowDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [flow, setFlow] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [yamlContent, setYamlContent] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReadme, setEditingReadme] = useState(false);
  const [readmeText, setReadmeText] = useState('');

  useEffect(() => {
    fetchFlow();
  }, [slug]);

  async function fetchFlow() {
    setLoading(true);
    const { data: flowData } = await supabase
      .from('flows')
      .select('*, profiles!flows_author_id_fkey(username, avatar_url)')
      .eq('slug', slug)
      .single();

    if (flowData) {
      setFlow(flowData);
      setReadmeText(flowData.readme || '');
      // Fetch YAML for preview
      if (flowData.yaml_key) {
        try {
          const { data: fileBlob } = await supabase.storage
            .from('flows')
            .download(flowData.yaml_key);
          if (fileBlob) {
            if (flowData.yaml_key.endsWith('.zip')) {
              const zip = await JSZip.loadAsync(await fileBlob.arrayBuffer());
              const yamlFile = zip.file('flow.yaml') || zip.file(/flow\.ya?ml$/i)[0];
              if (yamlFile) {
                setYamlContent(await yamlFile.async('string'));
              }
            } else {
              setYamlContent(await fileBlob.text());
            }
          }
        } catch {}
      }
      const { data: commentData } = await supabase
        .from('comments')
        .select('*, profiles!comments_author_id_fkey(username, avatar_url)')
        .eq('flow_id', flowData.id)
        .order('created_at', { ascending: true });
      setComments(commentData || []);
    }
    setLoading(false);
  }

  async function handleDownload() {
    if (!user) return;
    setDownloading(true);

    await supabase.rpc('increment_download', { flow_slug: flow.slug });

    const { data } = await supabase.storage
      .from('flows')
      .download(flow.yaml_key);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      const ext = flow.yaml_key.endsWith('.zip') ? '.zip' : '.yaml';
      a.download = `${flow.slug}${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setFlow((prev) => ({ ...prev, downloads: prev.downloads + 1 }));
    }
    setDownloading(false);
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({ flow_id: flow.id, author_id: user.id, content: commentText.trim() })
      .select('*, profiles!comments_author_id_fkey(username, avatar_url)')
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setCommentText('');
      setFlow((prev) => ({ ...prev, comments_count: prev.comments_count + 1 }));
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setFlow((prev) => ({ ...prev, comments_count: prev.comments_count - 1 }));
  }

  async function handleSaveReadme() {
    await supabase
      .from('flows')
      .update({ readme: readmeText })
      .eq('id', flow.id);
    setFlow((prev) => ({ ...prev, readme: readmeText }));
    setEditingReadme(false);
  }

  async function handleReadmeImage(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const ext = file.name.split('.').pop();
    const key = `${user.id}/readme/${flow.slug}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('flows')
      .upload(key, file, { contentType: file.type });
    if (upErr) return;
    const { data: { publicUrl } } = supabase.storage.from('flows').getPublicUrl(key);
    const imgMd = `![${file.name}](${publicUrl})\n`;
    setReadmeText((prev) => prev + imgMd);
  }

  const isAuthor = user?.id === flow?.author_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse-slow">hourglass_empty</span>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">error</span>
        <p className="mt-4 text-on-surface-variant">Flow not found.</p>
        <Link to="/" className="btn-primary btn-sm mt-6 inline-block">{t('detail.back')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary mb-6 transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('detail.back')}
      </Link>

      <div className="card-glass mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h1 className="font-headline font-bold text-3xl md:text-4xl text-on-surface mb-2">
              {flow.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>{t('detail.by')}</span>
              {flow.profiles?.avatar_url && (
                <img src={flow.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span className="text-primary">{flow.profiles?.username}</span>
              <span>·</span>
              <span>{new Date(flow.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {user ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary btn-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {downloading ? '...' : t('detail.download')}
              </button>
            ) : (
              <Link to="/login" className="btn-ghost btn-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                {t('detail.loginToDownload')}
              </Link>
            )}
          </div>
        </div>

        {flow.description && (
          <p className="text-on-surface-variant text-sm mb-4">{flow.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {flow.tags?.map((tag) => (
            <span key={tag} className="badge-tag">{tag}</span>
          ))}
        </div>

        {/* README */}
        {(flow.readme || isAuthor) && (
          <div className="mb-4">
            {editingReadme ? (
              <div className="space-y-3">
                <textarea
                  value={readmeText}
                  onChange={(e) => setReadmeText(e.target.value)}
                  className="textarea-field h-48 font-mono text-sm"
                  placeholder="Write a README in Markdown..."
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveReadme} className="btn-primary btn-sm">
                    {t('common.save')}
                  </button>
                  <button onClick={() => { setEditingReadme(false); setReadmeText(flow.readme || ''); }} className="btn-ghost btn-sm">
                    {t('common.cancel')}
                  </button>
                  <label className="btn-ghost btn-sm cursor-pointer flex items-center gap-1 ml-auto">
                    <span className="material-symbols-outlined text-sm">image</span>
                    {t('detail.insertImage')}
                    <input type="file" accept="image/*" onChange={handleReadmeImage} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                {flow.readme ? (
                  <div className="markdown-body text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{flow.readme}</ReactMarkdown>
                  </div>
                ) : isAuthor ? (
                  <p className="text-on-surface-variant/50 text-sm italic">{t('detail.noReadme')}</p>
                ) : null}
                {isAuthor && (
                  <button
                    onClick={() => setEditingReadme(true)}
                    className="mt-2 text-xs text-primary hover:text-primary-container transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {flow.readme ? t('detail.editReadme') : t('detail.addReadme')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-on-surface-variant border-t border-outline-variant/20 pt-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span>
            {flow.downloads} {t('detail.downloads')}
          </span>
          {flow.node_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">account_tree</span>
              {flow.node_count} {t('detail.nodes')}
            </span>
          )}
        </div>
      </div>

      {/* Flow Preview */}
      {yamlContent && (
        <div className="card-solid mb-8">
          <h2 className="font-headline font-bold text-xl mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_tree</span>
            {t('detail.flowPreview')}
          </h2>
          <div className="rounded-2xl overflow-hidden border border-outline-variant/20" style={{ height: '600px', background: '#141c30' }}>
            <FlowViewer flowData={yamlContent} />
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card-solid">
        <h2 className="font-headline font-bold text-xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">forum</span>
          {t('detail.comments')} ({flow.comments_count})
        </h2>

        {comments.length === 0 ? (
          <p className="text-on-surface-variant text-sm py-4">{t('detail.noComments')}</p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-surface-container">
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">account_circle</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-primary">{comment.profiles?.username}</span>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {user?.id === comment.author_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-auto text-xs text-error hover:text-on-error transition-colors"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                  <p className="text-on-surface text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {user ? (
          <form onSubmit={handleComment} className="flex gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('detail.commentPlaceholder')}
              className="input-field flex-1"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="btn-primary btn-sm"
            >
              {t('detail.submitComment')}
            </button>
          </form>
        ) : (
          <Link to="/login" className="text-sm text-primary hover:text-primary-container transition-colors">
            {t('detail.loginToComment')}
          </Link>
        )}
      </div>
    </div>
  );
}
