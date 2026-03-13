import { Client, Databases } from "node-appwrite";

const endpoint = process.env.APPWRITE_URL;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Missing Appwrite server env vars. Set APPWRITE_URL, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY."
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

export const serverDatabases = new Databases(client);
