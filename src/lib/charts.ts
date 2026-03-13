const CHARTS_API_URL = '/api/charts';

export interface BirthChart {
  $id: string;
  userId: string;
  label: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude?: number;
  longitude?: number;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  chartData?: string;
  createdAt: string;
}

/** Create a new birth chart document */
export async function createBirthChart(data: Omit<BirthChart, '$id' | 'createdAt'>) {
  const response = await fetch(CHARTS_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create birth chart');
  }

  const json = await response.json();
  return json.document as BirthChart;
}

/** Fetch all charts for a given userId */
export async function getUserCharts(userId: string): Promise<BirthChart[]> {
  const response = await fetch(
    `${CHARTS_API_URL}?userId=${encodeURIComponent(userId)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user charts');
  }

  const json = await response.json();
  return (json.documents ?? []) as BirthChart[];
}

/** Delete a chart */
export async function deleteBirthChart(chartId: string) {
  const response = await fetch(`${CHARTS_API_URL}/${encodeURIComponent(chartId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete birth chart');
  }
}

/** Update a chart */
export async function updateBirthChart(chartId: string, data: Partial<BirthChart>) {
  const response = await fetch(`${CHARTS_API_URL}/${encodeURIComponent(chartId)}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update birth chart');
  }

  const json = await response.json();
  return json.document as BirthChart;
}
