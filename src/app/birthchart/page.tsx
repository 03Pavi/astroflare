'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserCharts, addChart, removeChart, editChart } from '@/store/slices/charts-slice';
import { type BirthChart } from '@/lib/charts';
import styles from './page.module.scss';

// Icons
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function BirthChartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [user, authLoading, router, dispatch]);

  const fetchLocations = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, birthPlace: value });

    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    suggestionTimeout.current = setTimeout(() => {
      fetchLocations(value);
    }, 500);
  };

  const selectLocation = (displayName: string) => {
    setFormData({ ...formData, birthPlace: displayName });
    setShowSuggestions(false);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingChartId(null);
    if (window.location.hash === '#modal') {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      window.history.pushState({ modalOpen: true }, '', '#modal');

      const handlePopState = (e: PopStateEvent) => {
        setIsModalOpen(false);
        setEditingChartId(null);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isModalOpen]);

  const openCreateModal = () => {
    setEditingChartId(null);
    setFormData({ label: '', birthDate: '', birthTime: '', birthPlace: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (chart: BirthChart) => {
    setEditingChartId(chart.$id);
    setFormData({
      label: chart.label,
      birthDate: chart.birthDate,
      birthTime: chart.birthTime,
      birthPlace: chart.birthPlace,
    });
    setMenuOpenId(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingChartId) {
        await dispatch(editChart({
          chartId: editingChartId,
          userId: user.uid,
          label: formData.label,
          dob: formData.birthDate,
          time: formData.birthTime,
          place: formData.birthPlace,
        })).unwrap();
      } else {
        await dispatch(addChart({
          userId: user.uid,
          label: formData.label,
          dob: formData.birthDate,
          time: formData.birthTime,
          place: formData.birthPlace,
        })).unwrap();
      }

      closeModal();
      setFormData({ label: '', birthDate: '', birthTime: '', birthPlace: '' });
    } catch (err) {
      console.error('Failed to handle chart action:', err);
      alert('Error updating cosmic map. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this birth chart?')) return;
    dispatch(removeChart(id));
    setMenuOpenId(null);
  };

  if (authLoading) return (
    <div className={styles.loadingOverlay}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 40 }} />
      </motion.div>
    </div>
  );

  return (
    <div className={styles.page}>
      <ThreeBackground />

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Birth Charts</h1>
            <p>Manage your celestial maps and explore the cosmic blueprints of your personal journey.</p>
          </div>
          <button className={styles.createBtn} onClick={openCreateModal}>
            <AddIcon fontSize="small" sx={{ color: '#fff' }} /> Create New Chart
          </button>
        </div>

        {chartsLoading && charts.length === 0 ? (
          <div className={styles.loadingOverlay}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <AutoAwesomeIcon sx={{ color: '#7c3aed', fontSize: 40 }} />
            </motion.div>
          </div>
        ) : charts.length > 0 ? (
          <div className={styles.chartsGrid}>
            {charts.map((chart: BirthChart) => (
              <motion.div
                key={chart.$id}
                className={styles.chartCard}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.chartIcon}>
                    <WbSunnyOutlinedIcon fontSize="small" sx={{ color: '#a78bfa' }} />
                  </div>
                  <div className={styles.headerInfo}>
                    <h3>{chart.label}</h3>
                    <span className={styles.sunSign}>{chart.sunSign ? `${chart.sunSign} SUN` : 'Sign Calculated'}</span>
                  </div>
                  <div className={styles.menuWrapper}>
                    <button className={styles.moreBtn} onClick={() => setMenuOpenId(menuOpenId === chart.$id ? null : chart.$id)}>
                      <MoreVertIcon fontSize="small" sx={{ color: '#64748b' }} />
                    </button>
                    <AnimatePresence>
                      {menuOpenId === chart.$id && (
                        <motion.div
                          className={styles.dropdownMenu}
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        >
                          <button onClick={() => openEditModal(chart)}>
                            <EditIcon fontSize="inherit" /> Update
                          </button>
                          <button className={styles.deleteAction} onClick={() => handleDelete(chart.$id)}>
                            <DeleteOutlineIcon fontSize="inherit" /> Delete Map
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.detailItem}>
                    <CalendarTodayIcon sx={{ fontSize: '1.1rem', color: '#475569' }} /> {new Date(chart.birthDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className={styles.detailItem}>
                    <AccessTimeIcon sx={{ fontSize: '1.1rem', color: '#475569' }} /> {chart.birthTime || 'Not set'}
                  </div>
                  <div className={styles.detailItem}>
                    <PlaceIcon sx={{ fontSize: '1.1rem', color: '#475569' }} /> {chart.birthPlace}
                  </div>
                </div>

                <div className={styles.badgeRow}>
                  <div className={styles.badge}>
                    <NightsStayOutlinedIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} /> {chart.moonSign || 'Taurus'}
                  </div>
                  <div className={styles.badge}>
                    <ExploreIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} /> {chart.risingSign || 'Virgo Rising'}
                  </div>
                </div>

                <Link href={`/birthchart/${chart.$id}`} className={styles.reportBtn}>
                  <AutoAwesomeIcon sx={{ fontSize: '1rem', mr: 1 }} />
                  View Full Report
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className={styles.emptyCard}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.emptyIconWrapper}>
              <ExploreIcon sx={{ fontSize: '2.5rem', color: '#a78bfa' }} />
            </div>
            <h2 className={styles.emptyTitle}>No Charts Found</h2>
            <p className={styles.emptyDesc}>
              Your journey through the stars hasn't begun yet. Create your first birth chart to reveal your celestial alignment.
            </p>
            <div className={styles.emptyActions}>
              <button className={styles.primaryBtn} onClick={openCreateModal}>Get Started</button>
              <button className={styles.secondaryBtn}>Load Examples</button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className={styles.modalHeader}>
                <h2>{editingChartId ? 'Update Birth Chart' : 'Create Birth Chart'}</h2>
                <p>{editingChartId ? 'Refine your birth details to update your map.' : 'Enter birth details for accurate cosmic calculation.'}</p>
              </div>

              <form className={styles.form} onSubmit={handleCreate}>
                <div className={styles.inputGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Orion Starling"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Time of Birth</label>
                    <input
                      type="time"
                      required
                      value={formData.birthTime}
                      onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>City of Birth</label>
                  <div className={styles.autocompleteWrapper}>
                    <input
                      type="text"
                      required
                      placeholder="Search city..."
                      value={formData.birthPlace}
                      onChange={handleLocationChange}
                      autoComplete="off"
                    />
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.ul
                          className={styles.suggestionsList}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {suggestions.map((item, idx) => (
                            <li
                              key={idx}
                              className={styles.suggestionItem}
                              onClick={() => selectLocation(item.display_name)}
                            >
                              {item.display_name}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <InfoOutlinedIcon fontSize="small" sx={{ color: '#60a5fa' }} />
                  <p>For the most accurate rising sign (ascendant), exact birth time and location are required.</p>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.calcBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Calculating...' : editingChartId ? 'Update Map' : 'Calculate Chart'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
