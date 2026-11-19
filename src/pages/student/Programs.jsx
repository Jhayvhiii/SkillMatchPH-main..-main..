import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Code, Briefcase, Stethoscope, HeartHandshake, PenTool, BrainCircuit,
  HardHat, Building, Scale, Microscope, Loader2, Server, Cpu, Bot, Pill, Activity,
  Radiation, TestTube, Wrench, Zap, Radio, Factory, FlaskConical, Calculator, Coins,
  Megaphone, Lightbulb, Utensils, GraduationCap, BookOpen, Dna, Palette, X,
  MapPin, Globe, ExternalLink, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw
} from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateLocationProximity, getSavedPinnedLocation } from '../../data/locationsData';

// ─── Static data (hoisted outside component to avoid recreation) ──────────────
const CATEGORIES = [
  'All', 'Technology', 'Business', 'Engineering', 'Health',
  'Criminal Justice', 'Arts & Humanities', 'Sciences', 'Education',
];

// SHS Strand → recommended categories
const STRAND_CATEGORY_MAP = {
  STEM:  ['Technology', 'Engineering', 'Sciences', 'Health'],
  ABM:   ['Business'],
  HUMSS: ['Arts & Humanities', 'Education', 'Criminal Justice'],
  GAS:   ['Technology', 'Business', 'Engineering', 'Health', 'Criminal Justice', 'Arts & Humanities', 'Sciences', 'Education'],
};

// Holland Code first letter → recommended categories
const HOLLAND_CATEGORY_MAP = {
  R: ['Engineering', 'Technology'],
  I: ['Sciences', 'Technology', 'Health'],
  A: ['Arts & Humanities', 'Education'],
  S: ['Education', 'Health', 'Criminal Justice'],
  E: ['Business', 'Criminal Justice'],
  C: ['Business', 'Education'],
};

// Map string identifiers from the database to actual React icon components
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

// SWR fetcher — single relational request to avoid N+1
const fetchPrograms = async () => {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      universities:program_universities(
        university:universities(*)
      )
    `)
    .order('category')
    .order('title');

  if (error) throw error;
  return data.map(program => ({
    ...program,
    universities: program.universities.map(u => u.university).filter(Boolean),
  }));
};

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// ─── Program Details Modal ────────────────────────────────────────────────────
const ProgramDetailsModal = ({ program, onClose }) => {
  if (!program) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%', maxWidth: '700px', maxHeight: '90vh',
          overflowY: 'auto', padding: '2.5rem', position: 'relative',
          border: '1px solid var(--accent-teal)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: '0.5rem',
          }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-teal)' }}>
            {ICON_MAP[program.icon_name] || <Code size={32} />}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {program.category}
            </span>
            <h2 style={{ fontSize: '2rem', margin: '0.2rem 0', color: 'var(--text-primary)' }}>{program.title}</h2>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          {program.description}
        </p>

        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={22} color="var(--accent-violet)" />
            Offered by these Universities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {program.universities && program.universities.length > 0 ? (
              program.universities.map(uni => (
                <motion.div
                  key={uni.id}
                  whileHover={{ x: 5, background: 'rgba(255,255,255,0.05)' }}
                  style={{
                    padding: '1.25rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '8px',
                      background: 'rgba(112, 0, 255, 0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)',
                    }}>
                      {uni.logo_url
                        ? <img src={uni.logo_url} alt={uni.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                        : <Building size={24} />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{uni.name}</h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} /> {uni.location || 'Location not listed'}
                      </p>
                    </div>
                  </div>
                  {uni.website && (
                    <a
                      href={uni.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                      <Globe size={16} /> Website <ExternalLink size={14} />
                    </a>
                  )}
                </motion.div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No universities currently listed for this program.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Programs Component ──────────────────────────────────────────────────
const Programs = () => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const pinnedLocation = getSavedPinnedLocation(user?.id);

  // Pagination states to prevent endless vertical scrolling
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // SWR fetch with no revalidation on focus
  const { data: programs, error, isLoading, mutate } = useSWR('programs_list', fetchPrograms, {
    revalidateOnFocus: false,
  });

  // Read Holland code stored by CareerAssessment page
  const hollandCode = useMemo(() => {
    if (!user?.id) return null;
    try {
      const raw = localStorage.getItem(`assessment_result_${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.hollandCode || null;
      }
      const legacy = localStorage.getItem(`assessment_${user.id}`);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return parsed?.result?.code || null;
      }
    } catch { /* ignore */ }
    return null;
  }, [user?.id]);

  // Build a Set of recommended categories from strand + Holland code
  const recommendedCategories = useMemo(() => {
    const rec = new Set();
    const strand = profile?.shs_strand;
    if (strand && STRAND_CATEGORY_MAP[strand]) {
      STRAND_CATEGORY_MAP[strand].forEach(c => rec.add(c));
    }
    if (hollandCode) {
      const letter = hollandCode[0]?.toUpperCase();
      if (letter && HOLLAND_CATEGORY_MAP[letter]) {
        HOLLAND_CATEGORY_MAP[letter].forEach(c => rec.add(c));
      }
    }
    return rec;
  }, [profile?.shs_strand, hollandCode]);

  const hasRecommendations = recommendedCategories.size > 0;

  // Sort category pills: recommended ones bubble up after 'All'
  const sortedCategories = useMemo(() => {
    const rest = CATEGORIES.filter(c => c !== 'All');
    rest.sort((a, b) => {
      const aR = recommendedCategories.has(a) ? 0 : 1;
      const bR = recommendedCategories.has(b) ? 0 : 1;
      return aR - bR;
    });
    return ['All', ...rest];
  }, [recommendedCategories]);

  // Filter programs; when viewing 'All' pin recommended programs to the top
  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    const searchLower = searchQuery.toLowerCase();

    const filtered = programs.filter(program => {
      const matchesCategory = activeCategory === 'All' || program.category === activeCategory;
      if (!matchesCategory) return false;
      if (!searchLower) return true;
      return (
        program.title.toLowerCase().includes(searchLower) ||
        program.description.toLowerCase().includes(searchLower)
      );
    });

    // Pin recommended programs first when browsing 'All'
    if (activeCategory === 'All' && hasRecommendations) {
      filtered.sort((a, b) => {
        const aR = recommendedCategories.has(a.category) ? 0 : 1;
        const bR = recommendedCategories.has(b.category) ? 0 : 1;
        return aR - bR;
      });
    }

    return filtered;
  }, [searchQuery, activeCategory, programs, recommendedCategories, hasRecommendations]);

  // Reset to page 1 when search or category or pageSize changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, pageSize]);

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

  // Build a personalized label for the recommendation hint
  const recommendationLabel = useMemo(() => {
    const parts = [];
    if (profile?.shs_strand) parts.push(`${profile.shs_strand} strand`);
    if (hollandCode) parts.push(`Holland Code ${hollandCode}`);
    return parts.length > 0 ? `Based on your ${parts.join(' & ')}` : 'Recommended for you';
  }, [profile?.shs_strand, hollandCode]);

  return (
    <div className="student-page" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 0 3rem' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', margin: 0, color: 'var(--text-primary)' }}>College Programs</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.95rem' }}>Explore potential career paths and degree programs in the Philippines.</p>
        </div>
        <button
          onClick={() => mutate()}
          className="refresh-btn"
          title="Refresh programs"
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
      </motion.div>

      {/* Search + Category Filters Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
        style={{ padding: '1.25rem', borderRadius: '20px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {/* Search Bar + Page Size */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              id="program-search"
              type="text"
              placeholder="Search programs by title or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search programs"
              style={{
                width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.8rem',
                borderRadius: '12px', border: '1px solid var(--glass-border)',
                background: 'var(--field-bg)', color: 'var(--text-primary)',
                fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Show:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{
                padding: '0.55rem 0.75rem',
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
              <option value={9}>9 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
            </select>
          </div>
        </div>

        {/* Recommendation hint */}
        {hasRecommendations && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.9rem', borderRadius: '999px',
            background: 'rgba(112, 0, 255, 0.08)',
            border: '1px solid rgba(112, 0, 255, 0.25)',
            color: 'var(--accent-violet)', fontSize: '0.82rem', fontWeight: 600,
            width: 'fit-content',
          }}>
            <Sparkles size={14} />
            {recommendationLabel} — highlighted categories are personalized for your profile
          </div>
        )}

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {sortedCategories.map(category => {
            const isActive = activeCategory === category;
            const isRec = category !== 'All' && recommendedCategories.has(category);
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  border: `1px solid ${
                    isActive ? 'var(--accent-teal)'
                    : isRec   ? 'rgba(112, 0, 255, 0.5)'
                    :           'var(--glass-border)'
                  }`,
                  background: isActive
                    ? 'rgba(0, 242, 254, 0.12)'
                    : isRec
                    ? 'rgba(112, 0, 255, 0.08)'
                    : 'var(--glass-bg)',
                  color: isActive
                    ? 'var(--accent-teal)'
                    : isRec
                    ? 'var(--accent-violet)'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: isActive || isRec ? 600 : 400,
                }}
              >
                {isRec && <Sparkles size={11} />}
                {category}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Programs Grid */}
      <motion.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                <Loader2 size={40} color="var(--accent-teal)" />
              </motion.div>
              <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Loading catalog programs...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}
            >
              <p style={{ color: '#ff4d4d', fontSize: '1.1rem' }}>Failed to load programs. Please try again.</p>
            </motion.div>
          ) : paginatedPrograms.length > 0 ? (
            paginatedPrograms.map(program => {
              const nearbyUnis = (program.universities || []).filter(u =>
                calculateLocationProximity(pinnedLocation, u.location, u.name).isNearby
              );
              const isNearby = nearbyUnis.length > 0;
              const isRec = recommendedCategories.has(program.category);

              return (
                <motion.div
                  key={program.id}
                  layout
                  variants={CARD_VARIANTS}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card"
                  whileHover={{ translateY: -4, borderColor: isRec ? 'var(--accent-violet)' : 'var(--accent-teal)' }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '1rem',
                    padding: '1.5rem', borderRadius: '18px',
                    ...(isRec ? { border: '1px solid rgba(112, 0, 255, 0.35)' } : {}),
                  }}
                >
                  {/* Card top row: icon + badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      padding: '0.65rem', borderRadius: '12px',
                      background: isRec ? 'rgba(112, 0, 255, 0.1)' : 'rgba(0, 242, 254, 0.1)',
                      color: isRec ? 'var(--accent-violet)' : 'var(--accent-teal)',
                    }}>
                      {ICON_MAP[program.icon_name] || <Code size={22} />}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {/* "For You" badge */}
                      {isRec && (
                        <span style={{
                          fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px',
                          background: 'rgba(112, 0, 255, 0.15)', color: 'var(--accent-violet)',
                          fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                        }}>
                          <Sparkles size={10} /> For You
                        </span>
                      )}
                      {/* "Near You" badge */}
                      {isNearby && (
                        <span style={{
                          fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px',
                          background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80',
                          fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                        }}>
                          <MapPin size={10} /> Near You
                        </span>
                      )}
                      {/* Category pill */}
                      <span style={{
                        fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '999px',
                        background: 'var(--glass-border)', color: 'var(--text-secondary)',
                      }}>
                        {program.category}
                      </span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                      {program.title}
                    </h3>
                    <p style={{
                      color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {program.description}
                    </p>
                  </div>

                  {/* View Details button */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <motion.button
                      onClick={() => setSelectedProgram(program)}
                      whileHover={{ scale: 1.01 }}
                      aria-label={`View details for ${program.title}`}
                      style={{
                        width: '100%', padding: '0.65rem', borderRadius: '10px',
                        border: `1px solid ${isRec ? 'var(--accent-violet)' : 'var(--accent-teal)'}`,
                        background: 'transparent', color: isRec ? 'var(--accent-violet)' : 'var(--accent-teal)',
                        fontWeight: 600, fontSize: '0.88rem',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      View Details
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}
            >
              <p style={{ margin: 0, fontSize: '1rem' }}>No programs found matching your search or selected category.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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

      {/* Program Details Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <ProgramDetailsModal
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Programs;
