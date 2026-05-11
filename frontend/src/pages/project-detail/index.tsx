import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { ProjectDto, WikiTreeItem, WikiPageDto, WikiSearchHit } from '@/types';
import { getProject } from '@/api/projects';
import { getWikiPageTree, getWikiPage, createWikiPage, updateWikiPage, deleteWikiPage, searchWikiPages } from '@/api/wiki';
import { useAuth } from '@/hooks/useAuth';
import { stageBadge, stageLabel, formatDate } from '@/utils/format';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import Field from '@/components/common/Field';
import IssuesTab from './IssuesTab';
import BoardTab from './BoardTab';
import RaidTab from './RaidTab';
import PhasesTab from './PhasesTab';
import SettingsTab from './SettingsTab';
import MembersTab from './MembersTab';
import SummaryTab from './SummaryTab';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

type Tab = 'summary' | 'issues' | 'board' | 'docs' | 'raid' | 'phases' | 'members' | 'settings';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { user } = useAuth();
  const role = user?.role;
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const isExternal = role === 'EXTERNAL';
  const canSeeScores = canEdit || role === 'EXECUTIVE' || role === 'HR';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProject(Number(id)).then(setProject).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!project) return <div className="text-center text-gray-500 py-8">Project not found.</div>;

  // Role-based tab visibility:
  // EXECUTIVE: summary, board, raid, docs
  // MANAGER:   summary, board, raid, issues, docs, phases, members, settings
  // HR:        summary, members, docs
  // CONTRIBUTOR: issues, board, docs
  // EXTERNAL: issues, board (existing behavior)
  const tabs: { key: Tab; label: string }[] = role === 'EXECUTIVE' ? [
    { key: 'summary', label: 'Summary' },
    { key: 'board', label: 'Board' },
    { key: 'raid', label: 'RAID' },
    { key: 'docs', label: 'Docs' },
  ] : role === 'MANAGER' ? [
    { key: 'summary', label: 'Summary' },
    { key: 'board', label: 'Board' },
    { key: 'raid', label: 'RAID' },
    { key: 'issues', label: 'Issues' },
    { key: 'docs', label: 'Docs' },
    { key: 'phases', label: 'Phases' },
    { key: 'members', label: 'Members' },
    { key: 'settings', label: 'Settings' },
  ] : role === 'HR' ? [
    { key: 'summary', label: 'Summary' },
    { key: 'members', label: 'Members' },
    { key: 'docs', label: 'Docs' },
  ] : role === 'CONTRIBUTOR' ? [
    { key: 'issues', label: 'Issues' },
    { key: 'board', label: 'Board' },
    { key: 'docs', label: 'Docs' },
  ] : [ // EXTERNAL or fallback
    { key: 'issues', label: 'Issues' },
    { key: 'board', label: 'Board' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{project.key}</span>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          {project.stage && <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>{stageLabel(project.stage)}</span>}
        </div>
        {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
          <span>Manager: {project.managerName}</span>
          {project.clientName && <span>Client: {project.clientName}</span>}
          {project.programName && <span>Program: {project.programName}</span>}
          {project.budget && <span>Budget: ${Number(project.budget).toLocaleString()}</span>}
          {project.strategicScore != null && <span>Score: {project.strategicScore}/10</span>}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'summary' && <SummaryTab projectId={project.id} managerId={project.managerId} onNavigate={setActiveTab} />}
      {activeTab === 'issues' && <IssuesTab projectId={project.id} projectKey={project.key} canEdit={canEdit} isExternal={isExternal} />}
      {activeTab === 'board' && <BoardTab projectId={project.id} projectKey={project.key} isExternal={isExternal} />}
      {activeTab === 'docs' && <DocsTab projectId={project.id} />}
      {activeTab === 'raid' && <RaidTab projectId={project.id} canEdit={canEdit} />}
      {activeTab === 'phases' && <PhasesTab projectId={project.id} canEdit={canEdit} />}
      {activeTab === 'settings' && <SettingsTab project={project} onUpdate={(p) => setProject(p)} canEdit={canEdit} />}
      {activeTab === 'members' && <MembersTab projectId={project.id} managerId={project.managerId} canEdit={canEdit} canSeeScores={canSeeScores} />}
    </div>
  );
}

// ─── Docs Tab ──────────────────────────────────────────────────────────────────

function DocsTab({ projectId }: { projectId: number }) {
  const [tree, setTree] = useState<WikiTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState<WikiPageDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchHit[]>([]);
  const [showNewPage, setShowNewPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try { setTree(await getWikiPageTree(projectId)); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const fetchPage = useCallback(async () => {
    if (!selectedId) { setPage(null); return; }
    try { setPage(await getWikiPage(projectId, selectedId)); } catch { setPage(null); }
  }, [projectId, selectedId]);

  useEffect(() => { fetchPage(); setEditing(false); }, [fetchPage]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try { setSearchResults(await searchWikiPages(projectId, searchQuery.trim())); } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, searchQuery]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateWikiPage(projectId, selectedId, { title: editTitle, content: editContent });
      setPage(updated);
      setEditing(false);
      fetchTree();
    } catch {
      setError('Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !confirm('Delete this page?')) return;
    await deleteWikiPage(projectId, selectedId);
    setSelectedId(null);
    setPage(null);
    fetchTree();
  };

  const startEditing = () => {
    if (!page) return;
    setEditTitle(page.title);
    setEditContent(page.content ?? '');
    setEditing(true);
  };

  const handleCreatePage = async (title: string, content: string, parentId: number | null) => {
    const created = await createWikiPage(projectId, { title, content: content || undefined, parentId: parentId ?? undefined });
    setShowNewPage(false);
    setSelectedId(created.id);
    fetchTree();
  };

  const selectSearchHit = (hit: WikiSearchHit) => {
    setSelectedId(hit.id);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
      {/* Left panel — page tree */}
      <div className="w-full md:w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((hit) => (
                <button key={hit.id} onClick={() => selectSearchHit(hit)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 truncate">
                  {hit.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-primary-600" /></div>
          ) : tree.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No pages yet</p>
          ) : (
            tree.map((item) => (
              <TreeNode key={item.id} item={item} selectedId={selectedId} onSelect={setSelectedId} depth={0} />
            ))
          )}
        </div>
        <div className="p-2 border-t border-gray-200">
          <button onClick={() => setShowNewPage(true)} className="w-full bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700">
            New Page
          </button>
        </div>
      </div>

      {/* Right panel — content */}
      <div className="flex-1 min-w-0">
        {!page ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">Select a page or create a new one</p>
          </div>
        ) : editing ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={saving || !editTitle.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Spinner className="h-4 w-4" />}Save
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{page.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={startEditing} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700">Edit</button>
                <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5">Delete</button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
              <span>By {page.authorName}</span>
              <span>Last updated {formatDate(page.updatedAt)}</span>
            </div>
            <div>
              {page.content
                ? <MarkdownRenderer content={page.content} />
                : <span className="text-gray-400 italic">No content yet. Click Edit to add content.</span>
              }
            </div>
          </div>
        )}
      </div>

      {showNewPage && (
        <NewPageModal tree={tree} onClose={() => setShowNewPage(false)} onSubmit={handleCreatePage} />
      )}
    </div>
  );
}

function TreeNode({ item, selectedId, onSelect, depth }: { item: WikiTreeItem; selectedId: number | null; onSelect: (id: number) => void; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = item.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-gray-50 ${selectedId === item.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => { onSelect(item.id); if (hasChildren) setExpanded(!expanded); }}
      >
        {hasChildren ? (
          <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="truncate">{item.title}</span>
      </div>
      {hasChildren && expanded && item.children.map((child) => (
        <TreeNode key={child.id} item={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

function NewPageModal({ tree, onClose, onSubmit }: { tree: WikiTreeItem[]; onClose: () => void; onSubmit: (title: string, content: string, parentId: number | null) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatPages = flattenTree(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim(), content, parentId);
    } catch {
      setError('Failed to create page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New Page" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="Title" value={title} onChange={setTitle} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Page</label>
          <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">None (top level)</option>
            {flatPages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (optional)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write your documentation here..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Spinner className="h-4 w-4" />}Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

function flattenTree(items: WikiTreeItem[], result: WikiTreeItem[] = []): WikiTreeItem[] {
  for (const item of items) {
    result.push(item);
    if (item.children.length > 0) flattenTree(item.children, result);
  }
  return result;
}