
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type BirthChart } from '@/lib/charts';

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
const CHARTS_API_URL = '/api/charts';

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Thunk to create a new birth chart.
 * 1. Calls internal API to get celestial details.
 * 2. Saves formatted chart to Appwrite.
 */
export const addChart = createAsyncThunk(
  'charts/addChart',
  async (
    payload: {
      userId: string;
      label: string;
      dob: string;
      time: string;
      place: string;
      lat?: string;
      lon?: string;
      astroPayload: {
        year: number;
        month: number;
        date: number;
        hours: number;
        minutes: number;
        seconds: number;
        latitude: number;
        longitude: number;
        timezone?: number;
        settings: {
          observation_point: 'topocentric';
          ayanamsha: 'lahiri';
        };
      };
    },
    { rejectWithValue }
  ) => {
    try {
      // 1. Call local server-side API (which calls the worker or now calculates locally)
      const response = await fetch(ASTRO_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload.astroPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to fetch celestial details from API'
        );
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
        latitude: payload.lat ? parseFloat(payload.lat) : undefined,
        longitude: payload.lon ? parseFloat(payload.lon) : undefined,
      };

      // 2. Save through internal server route
      const saveResponse = await fetch(CHARTS_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(newChartData),
      });

      if (!saveResponse.ok) {
        throw new Error(
          await parseErrorMessage(saveResponse, 'Failed to save birth chart')
        );
      }

      const saveData = await saveResponse.json();
      return saveData.document as BirthChart;
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
      const response = await fetch(
        `${CHARTS_API_URL}?userId=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        throw new Error(
          await parseErrorMessage(response, 'Failed to fetch user charts')
        );
      }

      const data = await response.json();
      return (data.documents ?? []) as BirthChart[];
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
      const response = await fetch(`${CHARTS_API_URL}/${encodeURIComponent(chartId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(
          await parseErrorMessage(response, 'Failed to delete birth chart')
        );
      }
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
    payload: {
      chartId: string;
      userId: string;
      label: string;
      dob: string;
      time: string;
      place: string;
      lat?: string;
      lon?: string;
      astroPayload: {
        year: number;
        month: number;
        date: number;
        hours: number;
        minutes: number;
        seconds: number;
        latitude: number;
        longitude: number;
        timezone?: number;
        settings: {
          observation_point: 'topocentric';
          ayanamsha: 'lahiri';
        };
      };
    },
    { rejectWithValue }
  ) => {
    try {
      // 1. Re-calculate celestial data
      const response = await fetch(ASTRO_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload.astroPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to fetch celestial details from API'
        );
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
        latitude: payload.lat ? parseFloat(payload.lat) : undefined,
        longitude: payload.lon ? parseFloat(payload.lon) : undefined,
      };

      // 2. Update through internal server route
      const updateResponse = await fetch(
        `${CHARTS_API_URL}/${encodeURIComponent(payload.chartId)}`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          await parseErrorMessage(updateResponse, 'Failed to update birth chart')
        );
      }

      const updateData = await updateResponse.json();
      return updateData.document as BirthChart;
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
