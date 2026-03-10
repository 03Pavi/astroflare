
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BirthChart, getUserCharts, createBirthChart, deleteBirthChart, updateBirthChart } from '@/lib/charts';

interface ChartsState {
  charts: BirthChart[];
  loading: boolean;
  error: string | null;
}

const initialState: ChartsState = {
  charts: [],
  loading: false,
  error: null,
};

const ASTRO_API_URL = '/api/birthchart';

/**
 * Thunk to create a new birth chart.
 * 1. Calls internal API to get celestial details.
 * 2. Saves formatted chart to Appwrite.
 */
export const addChart = createAsyncThunk(
  'charts/addChart',
  async (
    payload: { userId: string; label: string; dob: string; time: string; place: string },
    { rejectWithValue }
  ) => {
    try {
      // 1. Call local server-side API (which calls the worker)
      const response = await fetch(ASTRO_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          dob: payload.dob, // YYYY-MM-DD
          time: payload.time,
          place: payload.place,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch celestial details from API');
      }

      const apiData = await response.json();

      // Map API response to our BirthChart schema
      // response format assumed based on requested curl example
      // expected: { sun_sign, moon_sign, ascendant, ... }

      const newChartData = {
        userId: payload.userId,
        label: payload.label,
        birthDate: payload.dob,
        birthTime: payload.time,
        birthPlace: payload.place,
        sunSign: apiData.sun_sign || '',
        moonSign: apiData.moon_sign || '',
        risingSign: apiData.ascendant || apiData.rising_sign || '',
        chartData: JSON.stringify(apiData),
        // You can add more fields from apiData if needed
      };

      // 2. Save to Appwrite
      const savedDoc = await createBirthChart(newChartData);
      return savedDoc as unknown as BirthChart;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Thunk to fetch all charts for a user
 */
export const fetchUserCharts = createAsyncThunk(
  'charts/fetchUserCharts',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await getUserCharts(userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Thunk to delete a chart
 */
export const removeChart = createAsyncThunk(
  'charts/removeChart',
  async (chartId: string, { rejectWithValue }) => {
    try {
      await deleteBirthChart(chartId);
      return chartId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Thunk to update a birth chart.
 */
export const editChart = createAsyncThunk(
  'charts/editChart',
  async (
    payload: { chartId: string; userId: string; label: string; dob: string; time: string; place: string },
    { rejectWithValue }
  ) => {
    try {
      // 1. Re-calculate celestial data
      const response = await fetch(ASTRO_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          dob: payload.dob,
          time: payload.time,
          place: payload.place,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch celestial details from API');
      }

      const apiData = await response.json();

      const updatedData = {
        label: payload.label,
        birthDate: payload.dob,
        birthTime: payload.time,
        birthPlace: payload.place,
        sunSign: apiData.sun_sign || '',
        moonSign: apiData.moon_sign || '',
        risingSign: apiData.ascendant || apiData.rising_sign || '',
        chartData: JSON.stringify(apiData),
      };

      // 2. Update in Appwrite
      const updatedDoc = await updateBirthChart(payload.chartId, updatedData);
      return updatedDoc as unknown as BirthChart;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch user charts
      .addCase(fetchUserCharts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserCharts.fulfilled, (state, action) => {
        state.loading = false;
        state.charts = action.payload;
      })
      .addCase(fetchUserCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add chart
      .addCase(addChart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addChart.fulfilled, (state, action) => {
        state.loading = false;
        state.charts.unshift(action.payload);
      })
      .addCase(addChart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Edit chart
      .addCase(editChart.pending, (state) => {
        state.loading = true;
      })
      .addCase(editChart.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.charts.findIndex(c => c.$id === action.payload.$id);
        if (index !== -1) {
          state.charts[index] = action.payload;
        }
      })
      .addCase(editChart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove chart
      .addCase(removeChart.fulfilled, (state, action) => {
        state.charts = state.charts.filter(c => c.$id !== action.payload);
      });
  },
});

export default chartsSlice.reducer;
