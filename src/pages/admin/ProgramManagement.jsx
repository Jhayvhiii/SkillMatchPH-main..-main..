import React, { useState, useMemo, useCallback, useDeferredValue, memo, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, Edit2, Trash2, X,
  AlertCircle, Loader2, Code, BrainCircuit, Briefcase,
  Building, HardHat, Stethoscope, Microscope, PenTool,
  HeartHandshake, Scale, Server, Cpu, Bot, Pill,
  Activity, Radiation, TestTube, Wrench, Zap, Radio,
  Factory, FlaskConical, Calculator, Coins, Megaphone,
  Lightbulb, Utensils, GraduationCap, Dna, Palette,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';
import MenuSelect from '../../components/common/MenuSelect';
import {
  getProgramWeights,
  PROGRAM_ASSESSMENT_MAP,
  CATEGORY_DEFAULT_MAP,
  RIASEC_ORDER,
  APTITUDE_ORDER,
  RIASEC_TRAITS,
  DOMAIN_METADATA
} from '../../data/assessmentData';

// ─── Constants & Fetchers (rendering-hoist-jsx & rerender-memo-with-default-value)
const CATEGORIES = ['Technology', 'Business', 'Engineering', 'Health', 'Criminal Justice', 'Arts & Humanities', 'Sciences', 'Education'];
const EMPTY_ARRAY = [];
const INITIAL_PROG_FORM = {
  title: '',
  category: CATEGORIES[0],
  description: '',
  icon_name: 'BookOpen'
};

const WEIGHT_SOURCE_LABELS = {
  published: 'the RIASEC College Program Weighting Guide',
  fallback: 'a Holland-code fallback (no guide row matched)',
  database: 'this program\'s stored weights',
};

const resolveGuideProfile = (title, category) => {
  const code = PROGRAM_ASSESSMENT_MAP[title]?.code || CATEGORY_DEFAULT_MAP[category]?.code || 'IRC';
  return getProgramWeights(title, category, code);
};

const roundVector = (vector, order) => order.reduce((acc, key) => {
  acc[key] = Math.round((Number(vector[key]) || 0) * 100) / 100;
  return acc;
}, {});

const vectorTotal = (vector, order) => order.reduce((sum, key) => sum + (Number(vector?.[key]) || 0), 0);

const ICON_MAP = {
  Code: <Code size={24} />,
  BrainCircuit: <BrainCircuit size={24} />,
  Briefcase: <Briefcase size={24} />,
  Building: <Building size={24} />,
  HardHat: <HardHat size={24} />,
  Stethoscope: <Stethoscope size={24} />,
  Microscope: <Microscope size={24} />,
  PenTool: <PenTool size={24} />,
  HeartHandshake: <HeartHandshake size={24} />,
  Scale: <Scale size={24} />,
  Server: <Server size={24} />,
  Cpu: <Cpu size={24} />,
  Bot: <Bot size={24} />,
  Pill: <Pill size={24} />,
  Activity: <Activity size={24} />,
  Radiation: <Radiation size={24} />,
  TestTube: <TestTube size={24} />,
  Wrench: <Wrench size={24} />,
  Zap: <Zap size={24} />,
  Radio: <Radio size={24} />,
  Factory: <Factory size={24} />,
  FlaskConical: <FlaskConical size={24} />,
  Calculator: <Calculator size={24} />,
  Coins: <Coins size={24} />,
  Megaphone: <Megaphone size={24} />,
  Lightbulb: <Lightbulb size={24} />,
  Utensils: <Utensils size={24} />,
  GraduationCap: <GraduationCap size={24} />,
  BookOpen: <BookOpen size={24} />,
  Dna: <Dna size={24} />,
  Palette: <Palette size={24} />,
};

const fetchPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('category')
    .order('title');

  if (error) throw error;
  return data;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ProgramCard = memo(forwardRef(({ program, onEdit, onDelete, index }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="glass-card"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '18px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '14px',
          background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 242, 254, 0.05)'
        }}>
          {ICON_MAP[program.icon_name] || <BookOpen size={24} />}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => onEdit(program)} className="icon-btn" title="Edit program" style={{ padding: '0.4rem' }}>
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(program.id)} className="icon-btn delete" title="Delete program" style={{ padding: '0.4rem' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {program.category}
        </span>
        <h3 style={{ margin: '0.3rem 0 0.4rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {program.title}
        </h3>
        <p style={{
          margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {program.description}
        </p>
      </div>
    </motion.div>
  );
}));

const ProgramModal = memo(forwardRef(({ program, onClose, onSave }, ref) => {
  const guideWeights = useMemo(
    () => resolveGuideProfile(program?.title || '', program?.category || CATEGORIES[0]),
    [program?.title, program?.category]
  );

  const initialRiasec = useMemo(
    () => roundVector(program?.riasec_weights || guideWeights.riasec, RIASEC_ORDER),
    [program?.riasec_weights, guideWeights.riasec]
  );
  const initialAptitude = useMemo(
    () => roundVector(program?.aptitude_weights || guideWeights.aptitude, APTITUDE_ORDER),
    [program?.aptitude_weights, guideWeights.aptitude]
  );

  const [formData, setFormData] = useState(() => program || INITIAL_PROG_FORM);
  const [useCustomWeights, setUseCustomWeights] = useState(() => Boolean(program?.riasec_weights));
  const [riasec, setRiasec] = useState(initialRiasec);
  const [aptitude, setAptitude] = useState(initialAptitude);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCategoryChange = useCallback((value) => {
    setFormData(prev => {
      const next = { ...prev, category: value };
      if (!useCustomWeights) {
        const fresh = resolveGuideProfile(next.title, next.category);
        setRiasec(roundVector(fresh.riasec, RIASEC_ORDER));
        setAptitude(roundVector(fresh.aptitude, APTITUDE_ORDER));
      }
      return next;
    });
  }, [useCustomWeights]);

  const handleTitleBlur = useCallback(() => {
    if (useCustomWeights) return;
    const fresh = resolveGuideProfile(formData.title, formData.category);
    setRiasec(roundVector(fresh.riasec, RIASEC_ORDER));
    setAptitude(roundVector(fresh.aptitude, APTITUDE_ORDER));
  }, [formData.title, formData.category, useCustomWeights]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (useCustomWeights) {
      const rSum = Math.round(vectorTotal(riasec, RIASEC_ORDER));
      const aSum = Math.round(vectorTotal(aptitude, APTITUDE_ORDER));
      if (rSum !== 100) {
        setError(`RIASEC weights must total 100% (currently ${rSum}%).`);
        return;
      }
      if (aSum !== 100) {
        setError(`Aptitude weights must total 100% (currently ${aSum}%).`);
        return;
      }
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        riasec_weights: useCustomWeights ? riasec : null,
        aptitude_weights: useCustomWeights ? aptitude : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        onClick={e => e.stopPropagation()}
        className="glass-card modal-content"
        style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{program ? 'Edit Program' : 'Add Program'}</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure degree titles, categories, and matching engine profiles.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="prog-title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Program Title *</label>
            <input
              id="prog-title"
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              onBlur={handleTitleBlur}
              placeholder="e.g. BS in Computer Science"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--field-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="prog-category" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
              <MenuSelect
                id="prog-category"
                label="Category"
                value={formData.category}
                onChange={handleCategoryChange}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="prog-icon" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Icon</label>
              <MenuSelect
                id="prog-icon"
                label="Icon"
                value={formData.icon_name}
                onChange={(value) => setFormData({ ...formData, icon_name: value })}
                options={Object.keys(ICON_MAP).map((name) => ({ value: name, label: name }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prog-desc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              id="prog-desc"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief overview of career paths and curriculum..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--field-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div role="alert" style={{ color: '#ff4d4d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" disabled={isSaving} className="submit-btn" style={{ minWidth: '140px' }}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : (program ? 'Save Changes' : 'Create Program')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}));

// ─── Main Admin Component ───────────────────────────────────────────────────

const ProgramManagement = () => {
  const { data: programs, isLoading, mutate } = useSWR('admin-programs', fetchPrograms);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedProg, setSelectedProg] = useState(null);

  // Pagination & Layout states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const allPrograms = programs || EMPTY_ARRAY;

  // Filter programs by category & search
  const filteredPrograms = useMemo(() => {
    const lowerQuery = deferredSearchQuery.toLowerCase();
    return allPrograms.filter(p => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (!lowerQuery) return true;
      return (
        p.title.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [allPrograms, deferredSearchQuery, categoryFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, categoryFilter, pageSize]);

  // Pagination slice calculations
  const totalItems = filteredPrograms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPrograms = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredPrograms.slice(startIndex, startIndex + pageSize);
  }, [filteredPrograms, validCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  // CRUD Operations
  const handleSave = useCallback(async (formData) => {
    try {
      if (modalMode === 'add') {
        const { error: err } = await supabase.from('programs').insert([formData]);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('programs').update(formData).eq('id', selectedProg.id);
        if (err) throw err;
      }
      mutate();
    } catch (err) {
      alert('Error saving program: ' + err.message);
      throw err;
    }
  }, [modalMode, selectedProg, mutate]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this program? It will be removed from all university listings.')) return;
    try {
      const { error: err } = await supabase.from('programs').delete().eq('id', id);
      if (err) throw err;
      mutate();
    } catch (err) {
      alert('Error deleting program: ' + err.message);
    }
  }, [mutate]);

  const handleEdit = useCallback((prog) => {
    setSelectedProg(prog);
    setModalMode('edit');
  }, []);

  return (
    <div className="admin-page" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 700 }}>Program Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            Manage the degree catalog, academic strands, and career pathways.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => mutate()}
            className="refresh-btn"
            title="Refresh list"
            style={{
              padding: '0.65rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => { setSelectedProg(null); setModalMode('add'); }}
            className="submit-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            <Plus size={18} /> Add Program
          </button>
        </div>
      </header>

      {/* Control Panel: Search, Category Filter, View Mode, Page Size */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '18px', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: searchQuery ? 1 : 0.5, pointerEvents: 'none' }} />
          <input
            id="prog-search"
            type="text"
            placeholder="Search programs by title or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 2.5rem 0.65rem 2.8rem',
              background: 'var(--field-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Quick Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--field-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Grid or Table */}
        <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'grid' ? 'var(--accent-teal)' : 'transparent',
              color: viewMode === 'grid' ? '#000' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Table view"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'table' ? 'var(--accent-teal)' : 'transparent',
              color: viewMode === 'table' ? '#000' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <TableIcon size={16} />
          </button>
        </div>

        {/* Per-Page Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Show:</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--field-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={6}>6 / page</option>
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem' }}>
                <Loader2 className="animate-spin" size={40} color="var(--accent-teal)" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading programs...</p>
              </div>
            ) : paginatedPrograms.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px dashed var(--glass-border)' }}>
                <BookOpen size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No programs found matching your search or filter.</p>
              </div>
            ) : (
              paginatedPrograms.map((prog, i) => (
                <ProgramCard key={prog.id} program={prog} onEdit={handleEdit} onDelete={handleDelete} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Table View */
        <div className="data-table-container glass-card" style={{ padding: 0, borderRadius: '18px', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <table className="data-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem 1.25rem' }}>Program</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedPrograms.map((prog, i) => (
                  <motion.tr
                    key={prog.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, delay: i * 0.015 }}
                  >
                    <td style={{ fontWeight: 600, padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {ICON_MAP[prog.icon_name] || <BookOpen size={16} />}
                        </div>
                        <div>{prog.title}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                        color: 'var(--accent-teal)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {prog.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '350px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prog.description || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button onClick={() => handleEdit(prog)} className="icon-btn" title="Edit" style={{ padding: '0.35rem' }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(prog.id)} className="icon-btn delete" title="Delete" style={{ padding: '0.35rem' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {paginatedPrograms.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                    No programs found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Compact Pagination Bar (Eliminates Scrolling) ───────────────────── */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.25rem',
        borderRadius: '16px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> – <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> programs
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage <= 1}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: validCurrentPage <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
              opacity: validCurrentPage <= 1 ? 0.35 : 1,
              cursor: validCurrentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={validCurrentPage <= 1}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: validCurrentPage <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
              opacity: validCurrentPage <= 1 ? 0.35 : 1,
              cursor: validCurrentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
            title="Previous page"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <span style={{ padding: '0 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Page {validCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={validCurrentPage >= totalPages}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: validCurrentPage >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
              opacity: validCurrentPage >= totalPages ? 0.35 : 1,
              cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
            title="Next page"
          >
            Next <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage >= totalPages}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: validCurrentPage >= totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
              opacity: validCurrentPage >= totalPages ? 0.35 : 1,
              cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode ? (
          <ProgramModal
            program={selectedProg}
            onClose={() => setModalMode(null)}
            onSave={handleSave}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ProgramManagement;
