import React, { useState, useMemo, useCallback, useDeferredValue, memo, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Plus, Search, Edit2, Trash2, X,
  ExternalLink, MapPin, Globe, AlertCircle,
  Loader2, GraduationCap, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, LayoutGrid, Table as TableIcon
} from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';

// ─── Constants & Fetchers (async-parallel & rerender-memo-with-default-value) ─
const EMPTY_ARRAY = [];
const INITIAL_UNI_FORM = {
  name: '',
  location: '',
  website: '',
  logo_url: '',
  program_ids: []
};

const fetchManagementData = async () => {
  const [uniResult, progResult] = await Promise.all([
    supabase.from('universities').select('*, program_universities(program_id)').order('name'),
    supabase.from('programs').select('id, title').order('title')
  ]);

  if (uniResult.error) throw uniResult.error;
  if (progResult.error) throw progResult.error;

  return {
    universities: uniResult.data.map(u => ({
      ...u,
      program_ids: u.program_universities.map(pu => pu.program_id)
    })),
    programs: progResult.data
  };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const UniversityCard = memo(forwardRef(({ university, onEdit, onDelete, index }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="glass-card"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '18px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '14px',
          background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 242, 254, 0.05)',
          overflow: 'hidden'
        }}>
          {university.logo_url ? (
            <img src={university.logo_url} alt={university.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Building size={24} />
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => onEdit(university)} className="icon-btn" title="Edit university" style={{ padding: '0.4rem' }}>
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(university.id)} className="icon-btn delete" title="Delete university" style={{ padding: '0.4rem' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: 700 }}>{university.name}</h3>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={14} /> {university.location || 'No location set'}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <div style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', borderRadius: '8px', background: 'rgba(112, 0, 255, 0.1)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
          <GraduationCap size={13} /> {university.program_ids.length} Programs
        </div>
        {university.website ? (
          <a href={university.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid transparent' }} className="hover-border">
            <Globe size={13} /> Website <ExternalLink size={11} />
          </a>
        ) : null}
      </div>
    </motion.div>
  );
}));

const UniversityModal = memo(forwardRef(({ university, programs, onClose, onSave }, ref) => {
  const [formData, setFormData] = useState(() => university || INITIAL_UNI_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleProgram = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      program_ids: prev.program_ids.includes(id)
        ? prev.program_ids.filter(pid => pid !== id)
        : [...prev.program_ids, id]
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('University name is required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
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
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{university ? 'Edit University' : 'Add University'}</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Configure university information and linked degree programs.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Close modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="uni-name" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>University Name *</label>
            <input
              id="uni-name"
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. University of the Philippines"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="uni-location" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Campus Location</label>
              <input
                id="uni-location"
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Quezon City, Metro Manila"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="uni-website" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Official Website</label>
              <input
                id="uni-website"
                type="url"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.edu.ph"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="uni-logo" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logo URL</label>
            <input
              id="uni-logo"
              type="url"
              value={formData.logo_url || ''}
              onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://.../logo.png"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: '#fff' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Offered Degree Programs ({formData.program_ids.length} selected)
            </label>
            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.4rem',
              background: 'rgba(0,0,0,0.15)'
            }}>
              {programs.map(prog => {
                const isSelected = formData.program_ids.includes(prog.id);
                return (
                  <label
                    key={prog.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(0, 242, 254, 0.3)' : 'transparent'}`,
                      color: isSelected ? 'var(--accent-teal)' : 'var(--text-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProgram(prog.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-teal)' }}
                    />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prog.title}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div role="alert" style={{ color: '#ff4d4d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" disabled={isSaving} className="submit-btn" style={{ minWidth: '140px' }}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : (university ? 'Save Changes' : 'Create University')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}));

// ─── Main Component ──────────────────────────────────────────────────────────

const UniversityManagement = () => {
  const { data, isLoading, mutate } = useSWR('admin-universities', fetchManagementData);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedUni, setSelectedUni] = useState(null);

  // Pagination & Layout states to eliminate scrolling!
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const universities = data?.universities || EMPTY_ARRAY;

  // Search filtering
  const filteredUniversities = useMemo(() => {
    const lowerQuery = deferredSearchQuery.toLowerCase();
    if (!lowerQuery) return universities;
    return universities.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.location?.toLowerCase().includes(lowerQuery)
    );
  }, [universities, deferredSearchQuery]);

  // Reset page when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, pageSize]);

  // Pagination calculations
  const totalItems = filteredUniversities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUniversities = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredUniversities.slice(startIndex, startIndex + pageSize);
  }, [filteredUniversities, validCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalItems);

  // CRUD Handlers
  const handleSave = useCallback(async (formData) => {
    const { program_ids, ...uniData } = formData;
    let universityId = selectedUni?.id;

    try {
      if (modalMode === 'add') {
        const { data: newUni, error: uniErr } = await supabase.from('universities').insert([uniData]).select().single();
        if (uniErr) throw uniErr;
        universityId = newUni.id;
      } else {
        const { error: uniErr } = await supabase.from('universities').update(uniData).eq('id', universityId);
        if (uniErr) throw uniErr;
      }

      const currentProgramIds = selectedUni?.program_ids || EMPTY_ARRAY;
      const currentSet = new Set(currentProgramIds);
      const newSet = new Set(program_ids);

      const toAdd = program_ids.filter(id => !currentSet.has(id));
      const toRemove = currentProgramIds.filter(id => !newSet.has(id));

      if (toRemove.length > 0) {
        await supabase.from('program_universities').delete().eq('university_id', universityId).in('program_id', toRemove);
      }
      if (toAdd.length > 0) {
        const links = toAdd.map(pid => ({ university_id: universityId, program_id: pid }));
        await supabase.from('program_universities').insert(links);
      }
      mutate();
    } catch (err) {
      alert('Error saving university: ' + err.message);
    }
  }, [modalMode, selectedUni, mutate]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this university? All program offerings will be unlinked.')) return;
    try {
      const { error } = await supabase.from('universities').delete().eq('id', id);
      if (error) throw error;
      mutate();
    } catch (err) {
      alert('Error deleting university: ' + err.message);
    }
  }, [mutate]);

  const handleEdit = useCallback((uni) => {
    setSelectedUni(uni);
    setModalMode('edit');
  }, []);

  return (
    <div className="admin-page" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 700 }}>University Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.95rem' }}>
            Manage partner institutions, locations, and linked program offerings.
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
            onClick={() => { setSelectedUni(null); setModalMode('add'); }}
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
            <Plus size={18} /> Add University
          </button>
        </div>
      </header>

      {/* Control Panel: Search & Pagination Configuration */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '18px', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: searchQuery ? 1 : 0.5, pointerEvents: 'none' }} />
          <input
            id="uni-search"
            type="text"
            placeholder="Search universities by name or location..."
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
                <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading universities...</p>
              </div>
            ) : paginatedUniversities.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px dashed var(--glass-border)' }}>
                <Building size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No universities found matching your criteria.</p>
              </div>
            ) : (
              paginatedUniversities.map((uni, i) => (
                <UniversityCard key={uni.id} university={uni} onEdit={handleEdit} onDelete={handleDelete} index={i} />
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
                <th style={{ padding: '1rem 1.25rem' }}>University</th>
                <th>Location</th>
                <th>Programs Offered</th>
                <th>Website</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedUniversities.map((uni, i) => (
                  <motion.tr
                    key={uni.id}
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
                          flexShrink: 0, overflow: 'hidden'
                        }}>
                          {uni.logo_url ? (
                            <img src={uni.logo_url} alt={uni.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Building size={16} />
                          )}
                        </div>
                        <div>{uni.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> {uni.location || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(112, 0, 255, 0.1)',
                        color: 'var(--accent-violet)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <GraduationCap size={13} /> {uni.program_ids.length}
                      </span>
                    </td>
                    <td>
                      {uni.website ? (
                        <a href={uni.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                          <Globe size={13} /> Visit <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button onClick={() => handleEdit(uni)} className="icon-btn" title="Edit" style={{ padding: '0.35rem' }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(uni.id)} className="icon-btn delete" title="Delete" style={{ padding: '0.35rem' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {paginatedUniversities.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                    No universities found matching your criteria.
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
          Showing <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> – <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> institutions
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
          <UniversityModal
            university={selectedUni}
            programs={data?.programs || EMPTY_ARRAY}
            onClose={() => setModalMode(null)}
            onSave={handleSave}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default UniversityManagement;
