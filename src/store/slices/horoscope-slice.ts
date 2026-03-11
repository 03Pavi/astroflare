import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface HoroscopeState {
  data: Record<string, {
    horoscope: any;
    lastFetched: string;
  }>;
  loading: boolean;
  error: string | null;
}

const initialState: HoroscopeState = {
  data: {},
  loading: false,
  error: null,
};

export const fetchHoroscope = createAsyncThunk(
  'horoscope/fetch',
  async (sign: string, { getState }) => {
    const response = await fetch('/api/daily-horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch horoscope');
    }

    const data = await response.json();
    return { sign, data };
  }
);

const horoscopeSlice = createSlice({
  name: 'horoscope',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHoroscope.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHoroscope.fulfilled, (state, action) => {
        state.loading = false;
        state.data[action.payload.sign.toLowerCase()] = {
          horoscope: action.payload.data,
          lastFetched: new Date().toISOString().split('T')[0] // Only the date part
        };
      })
      .addCase(fetchHoroscope.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown error';
      });
  },
});

export const { clearError } = horoscopeSlice.actions;
export default horoscopeSlice.reducer;
