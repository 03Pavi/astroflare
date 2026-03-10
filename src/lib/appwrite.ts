import { Client, Account, Databases } from 'appwrite';

const client = new Client();

if (process.env.NEXT_PUBLIC_APPWRITE_URL && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_URL)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
} else {
  console.warn('Appwrite URL and Project ID are not set. Check your environment variables.');
  // Set default dummy values to prevent build from failing
  client.setEndpoint('https://cloud.appwrite.io/v1')
        .setProject('dummy_project_id');
}

export const account = new Account(client);
export const databases = new Databases(client);
export default client;