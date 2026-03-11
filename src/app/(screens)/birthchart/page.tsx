'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserCharts, addChart, removeChart, editChart } from '@/store/slices/charts-slice';
import { type BirthChart } from '@/lib/charts';
import styles from './page.module.scss';
import dayjs, { Dayjs } from 'dayjs';

// MUI Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { TextField, Autocomplete, createTheme, ThemeProvider, Snackbar, Alert, CircularProgress } from '@mui/material';

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

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7c3aed',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#64748b',
    opacity: 1,
  },
};

export default function BirthChartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [loadingChartId, setLoadingChartId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    birthDate: null as Dayjs | null,
    birthTime: null as Dayjs | null,
    birthPlace: '',
    lat: '',
    lon: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
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
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error);
    } finally {
      setIsSearchingLocation(false);
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

  const selectLocation = (item: any) => {
    setFormData({
      ...formData,
      birthPlace: item.display_name,
      lat: item.lat,
      lon: item.lon
    });
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
    setFormData({ label: '', birthDate: null, birthTime: null, birthPlace: '', lat: '', lon: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (chart: BirthChart) => {
    setEditingChartId(chart.$id);
    setFormData({
      label: chart.label,
      birthDate: chart.birthDate ? dayjs(chart.birthDate) : null,
      birthTime: chart.birthTime ? dayjs(`2000-01-01 ${chart.birthTime}`) : null,
      birthPlace: chart.birthPlace,
      lat: chart.latitude?.toString() || '',
      lon: chart.longitude?.toString() || '',
    });
    setMenuOpenId(null);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.birthDate || !formData.birthTime) return;

    setIsSubmitting(true);
    try {
      const dobFormatted = formData.birthDate.format('YYYY-MM-DD');
      const timeFormatted = formData.birthTime.format('HH:mm');

      if (editingChartId) {
        await dispatch(editChart({
          chartId: editingChartId,
          userId: user.uid,
          label: formData.label,
          dob: dobFormatted,
          time: timeFormatted,
          place: formData.birthPlace,
          lat: formData.lat,
          lon: formData.lon,
        })).unwrap();
      } else {
        await dispatch(addChart({
          userId: user.uid,
          label: formData.label,
          dob: dobFormatted,
          time: timeFormatted,
          place: formData.birthPlace,
          lat: formData.lat,
          lon: formData.lon,
        })).unwrap();
      }

      closeModal();
      setFormData({ label: '', birthDate: null, birthTime: null, birthPlace: '', lat: '', lon: '' });
      setSnackbar({
        open: true,
        message: editingChartId ? 'Cosmic map updated successfully!' : 'Birth chart created successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Failed to handle chart action:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Error updating cosmic map. Please check your data.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this birth chart?')) return;
    dispatch(removeChart(id));
    setMenuOpenId(null);
  };

  if (authLoading || (!user && !authLoading)) return null;

  const ChartSkeleton = () => (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonLines}>
          <div className={styles.skeletonLineShort} />
          <div className={styles.skeletonLineTiny} />
        </div>
      </div>
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLineLong} />
        <div className={styles.skeletonLineLong} />
        <div className={styles.skeletonLineLong} />
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonRect} />
      </div>
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

        {chartsLoading ? (
          <div className={styles.chartsGrid}>
            {[1, 2, 3].map((i) => (
              <ChartSkeleton key={i} />
            ))}
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

                <button
                  className={styles.reportBtn}
                  onClick={() => { setLoadingChartId(chart.$id); router.push(`/birthchart/${chart.$id}`); }}
                  disabled={loadingChartId === chart.$id}
                >
                  {loadingChartId === chart.$id ? (
                    <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} /> Loading...</>
                  ) : (
                    <><AutoAwesomeIcon sx={{ fontSize: '1rem', mr: 1 }} /> View Full Report</>
                  )}
                </button>
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

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <form className={styles.form} onSubmit={handleCreate}>
                  <div className={styles.inputGroup}>
                    <label>Full Name</label>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="e.g. Orion Starling"
                      required
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      sx={textFieldSx}
                    />
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Date of Birth</label>
                      <MobileDatePicker
                        value={formData.birthDate}
                        onChange={(newValue) => setFormData({ ...formData, birthDate: newValue })}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            required: true,
                            sx: textFieldSx
                          }
                        }}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Time of Birth</label>
                      <MobileTimePicker
                        minutesStep={1}
                        ampm={true}
                        value={formData.birthTime}
                        onChange={(newValue) => setFormData({ ...formData, birthTime: newValue })}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            required: true,
                            sx: textFieldSx
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>City of Birth</label>
                    <Autocomplete
                      freeSolo
                      loading={isSearchingLocation}
                      options={suggestions}
                      inputValue={formData.birthPlace}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.display_name}
                      onInputChange={(event, newInputValue) => {
                        setFormData({ ...formData, birthPlace: newInputValue });
                        if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
                        suggestionTimeout.current = setTimeout(() => {
                          fetchLocations(newInputValue);
                        }, 500);
                      }}
                      onChange={(event, newValue: any) => {
                        if (newValue && typeof newValue !== 'string') {
                          selectLocation(newValue);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search city..."
                          required
                          size="small"
                          sx={textFieldSx}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {isSearchingLocation ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            ),
                          }}
                        />
                      )}
                    />
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
              </LocalizationProvider>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
