import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import yaml from 'js-yaml';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/AuthContext.jsx';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function countNodes(yamlContent) {
  try {
    const doc = yaml.load(yamlContent);
    if (doc?.nodes && Array.isArray(doc.nodes)) return doc.nodes.length;
    if (doc?.pipeline?.nodes && Array.isArray(doc.pipeline.nodes)) return doc.pipeline.nodes.length;
    return 0;
  } catch {
    return 0;
  }
}

export default function Publish() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  // YAML mode
  const [yamlContent, setYamlContent] = useState('');
  const [nodeCount, setNodeCount] = useState(0);
  const [yamlError, setYamlError] = useState('');
  // File mode (zip or yaml file)
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('yaml'); // 'yaml' | 'zip'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  function handleYamlChange(content) {
    setYamlContent(content);
    setYamlError('');
    try {
      yaml.load(content);
      setNodeCount(countNodes(content));
    } catch (e) {
      setYamlError(e.message);
      setNodeCount(0);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isZip = file.name.endsWith('.zip');
    if (isZip) {
      setUploadMode('zip');
      setUploadFile(file);
      setYamlContent('');
      setYamlError('');
      setNodeCount(0);
    } else {
      setUploadMode('yaml');
      setUploadFile(null);
      const reader = new FileReader();
      reader.onload = (ev) => handleYamlChange(ev.target.result);
      reader.readAsText(file);
    }
  }

  function clearZip() {
    setUploadFile(null);
    setUploadMode('yaml');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const hasContent = uploadMode === 'zip' ? !!uploadFile : !!yamlContent.trim();
    if (!title.trim() || !hasContent || (uploadMode === 'yaml' && yamlError)) return;

    setSubmitting(true);
    setError('');

    const slug = slugify(title) + '-' + Date.now().toString(36);
    const ext = uploadMode === 'zip' ? '.zip' : '.yaml';
    const contentType = uploadMode === 'zip' ? 'application/zip' : 'text/yaml';
    const fileKey = `${user.id}/${slug}${ext}`;
    const tags = tagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const blob = uploadMode === 'zip'
      ? uploadFile
      : new Blob([yamlContent], { type: 'text/yaml' });

    const { error: uploadErr } = await supabase.storage
      .from('flows')
      .upload(fileKey, blob, { contentType });

    if (uploadErr) {
      setError(uploadErr.message);
      setSubmitting(false);
      return;
    }

    const { error: insertErr, data: insertData } = await supabase
      .from('flows')
      .insert({
        slug,
        author_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        tags,
        yaml_key: fileKey,
        node_count: nodeCount,
      })
      .select();

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    if (!insertData || insertData.length === 0) {
      setError('Insert failed — check permissions.');
      setSubmitting(false);
      return;
    }

    navigate(`/flows/${slug}`);
  }

  const canSubmit = title.trim() &&
    (uploadMode === 'zip' ? !!uploadFile : !!yamlContent.trim()) &&
    (uploadMode === 'yaml' ? !yamlError : true) &&
    !submitting;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 md:py-12">
      <h1 className="font-headline font-bold text-3xl md:text-4xl mb-8">
        {t('publish.title')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            {t('publish.titleField')} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('publish.titlePlaceholder')}
            className="input-field"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            {t('publish.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('publish.descriptionPlaceholder')}
            className="textarea-field h-24"
            maxLength={1000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            {t('publish.tags')}
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('publish.tagsPlaceholder')}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            {t('publish.yaml')} *
          </label>

          <div className="mb-3 flex gap-3">
            <label className="btn-ghost btn-sm cursor-pointer inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              {t('publish.yamlUpload')}
              <input
                type="file"
                accept=".yaml,.yml,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <span className="text-xs text-on-surface-variant self-center">
              .yaml / .zip
            </span>
          </div>

          {uploadMode === 'zip' && uploadFile ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary">folder_zip</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface font-medium truncate">{uploadFile.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {(uploadFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button type="button" onClick={clearZip} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={yamlContent}
                onChange={(e) => handleYamlChange(e.target.value)}
                placeholder={t('publish.yamlPaste')}
                className="textarea-field h-48 font-mono text-sm"
                required={uploadMode === 'yaml'}
              />
              {yamlError && (
                <p className="text-error text-sm mt-2">{yamlError}</p>
              )}
              {nodeCount > 0 && (
                <p className="text-primary text-sm mt-2">
                  {t('publish.preview')}: {nodeCount} {t('publish.nodeCount')}
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error-container/20 text-error text-sm">
            {t('publish.error')}: {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              {t('publish.publishing')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">publish</span>
              {t('publish.submit')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
