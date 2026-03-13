import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type CareerState = {
  d10Data: Record<string, unknown> | null;
  d10ByUser: Record<string, Record<string, Record<string, unknown>>>;
  d10Loading: boolean;
  d10Error: string | null;
  aiText: string;
  aiLoading: boolean;
  aiError: string | null;
};

const initialState: CareerState = {
  d10Data: null,
  d10ByUser: {},
  d10Loading: false,
  d10Error: null,
  aiText: "",
  aiLoading: false,
  aiError: null,
};

function getCacheKeys(chart: any) {
  const userId = String(chart?.userId ?? "");
  const chartId = String(
    chart?.$id ?? `${chart?.birthDate ?? ""}-${chart?.birthTime ?? ""}-${chart?.label ?? ""}`
  );
  return { userId, chartId };
}

function buildCareerPayload(chart: any) {
  if (!chart?.birthDate || !chart?.birthTime) return null;

  const [year, month, date] = String(chart.birthDate)
    .split("-")
    .map((value) => Number.parseInt(value, 10));

  const [hours, minutes] = String(chart.birthTime)
    .split(":")
    .map((value) => Number.parseInt(value, 10));

  const latitude = Number(chart.latitude);
  const longitude = Number(chart.longitude);

  let timezone: number | undefined;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(date) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  if (chart.chartData) {
    try {
      const parsed = JSON.parse(chart.chartData);
      if (Number.isFinite(Number(parsed?.timezone))) {
        timezone = Number(parsed.timezone);
      }
    } catch {
      // ignore parse errors
    }
  }

  return {
    year,
    month,
    date,
    hours,
    minutes,
    seconds: 0,
    latitude,
    longitude,
    timezone,
    config: {
      observation_point: "topocentric" as const,
      ayanamsha: "lahiri" as const,
    },
  };
}

export const fetchCareerD10 = createAsyncThunk(
  "career/fetchD10",
  async (chart: any, { rejectWithValue, getState }) => {
    try {
      const { userId, chartId } = getCacheKeys(chart);
      const rootState = getState() as {
        career?: { d10ByUser?: Record<string, Record<string, Record<string, unknown>>> };
      };
      const cached = rootState?.career?.d10ByUser?.[userId]?.[chartId];
      if (cached) {
        return { output: cached, userId, chartId, fromCache: true as const };
      }

      const payload = buildCareerPayload(chart);
      if (!payload) {
        throw new Error("Selected chart is missing valid birth details.");
      }

      const response = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch D10 data");
      }

      return {
        output: data.output as Record<string, unknown>,
        userId,
        chartId,
        fromCache: false as const,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch D10 data";
      return rejectWithValue(message);
    }
  },
  {
    condition: (_chart, { getState }) => {
      const state = getState() as { career?: { d10Loading?: boolean } };
      // Prevent repeated in-flight calls causing perpetual skeleton state.
      return !state?.career?.d10Loading;
    },
  }
);

export const analyzeCareerByAI = createAsyncThunk(
  "career/analyzeAI",
  async (career: unknown, { rejectWithValue }) => {
    try {
      const normalizedChartData = Array.isArray(career)
        ? career
        : { output: career };

      const res = await fetch("/api/ai-analysis?query=career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartData: normalizedChartData,
          context: null,
          stream: false,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to get career AI analysis");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No stream body");
      }

      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";
      let shouldStop = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done || shouldStop) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const p of parts) {
          const packet = p.trim();
          if (!packet) continue;

          if (packet.startsWith("data: ")) {
            const data = packet.replace(/^data:\s*/, "").trim();
            if (data === "[DONE]") {
              shouldStop = true;
              break;
            }

            // Support both plain text data chunks and JSON SSE chunks.
            try {
              const parsed = JSON.parse(data);
              const extracted =
                parsed?.response ||
                parsed?.answer ||
                parsed?.text ||
                parsed?.token ||
                parsed?.delta?.content ||
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.choices?.[0]?.text ||
                "";
              result += typeof extracted === "string" ? extracted : String(extracted);
            } catch {
              result += data;
            }
            continue;
          }

          // fallback for non-SSE chunks
          result += packet;
        }
      }

      if (!result.trim() && buffer.trim()) {
        result += buffer.trim();
      }

      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to get career AI analysis";
      return rejectWithValue(message);
    }
  }
);

const careerSlice = createSlice({
  name: "career",
  initialState,
  reducers: {
    clearCareerAI: (state) => {
      state.aiText = "";
      state.aiError = null;
    },
    setActiveCareerD10: (state, action) => {
      state.d10Data = (action.payload as Record<string, unknown>) ?? null;
      state.d10Loading = false;
      state.d10Error = null;
    },
    resetCareerState: (state) => {
      state.d10Data = null;
      state.d10ByUser = {};
      state.d10Loading = false;
      state.d10Error = null;
      state.aiText = "";
      state.aiLoading = false;
      state.aiError = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCareerD10.pending, (state) => {
      state.d10Loading = true;
      state.d10Error = null;
    });

    builder.addCase(fetchCareerD10.fulfilled, (state, action) => {
      state.d10Loading = false;
      const payload = action.payload;
      state.d10Data = payload?.output ?? null;
      if (payload?.userId && payload?.chartId && payload?.output) {
        if (!state.d10ByUser[payload.userId]) {
          state.d10ByUser[payload.userId] = {};
        }
        state.d10ByUser[payload.userId][payload.chartId] = payload.output;
      }
    });

    builder.addCase(fetchCareerD10.rejected, (state, action) => {
      state.d10Loading = false;
      state.d10Error = (action.payload as string) || "Failed to fetch D10 data";
    });

    builder.addCase(analyzeCareerByAI.pending, (state) => {
      state.aiLoading = true;
      state.aiError = null;
    });

    builder.addCase(analyzeCareerByAI.fulfilled, (state, action) => {
      state.aiLoading = false;
      state.aiText = action.payload || "";
    });

    builder.addCase(analyzeCareerByAI.rejected, (state, action) => {
      state.aiLoading = false;
      state.aiError =
        (action.payload as string) || "Failed to get career AI analysis";
    });

    builder.addMatcher(
      (action) => action.type === "persist/REHYDRATE",
      (state) => {
        // Loading flags should never survive app reloads.
        state.d10Loading = false;
        state.aiLoading = false;
      }
    );
  },
});

export const { clearCareerAI, setActiveCareerD10, resetCareerState } = careerSlice.actions;
export default careerSlice.reducer;
