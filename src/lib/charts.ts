import { databases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;
const CHARTS_ID = process.env.NEXT_PUBLIC_APPWRITE_CHARTS_COLLECTION_ID as string;

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
  return databases.createDocument(DB_ID, CHARTS_ID, ID.unique(), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Fetch all charts for a given userId */
export async function getUserCharts(userId: string): Promise<BirthChart[]> {
  const res = await databases.listDocuments(DB_ID, CHARTS_ID, [
    Query.equal('userId', userId),
    Query.orderDesc('createdAt'),
  ]);
  return res.documents as unknown as BirthChart[];
}

/** Delete a chart */
export async function deleteBirthChart(chartId: string) {
  return databases.deleteDocument(DB_ID, CHARTS_ID, chartId);
}

/** Update a chart */
export async function updateBirthChart(chartId: string, data: Partial<BirthChart>) {
  return databases.updateDocument(DB_ID, CHARTS_ID, chartId, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}
