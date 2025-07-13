import { Account, Client, Databases, ID } from 'react-native-appwrite';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!) 
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);
  
export const account = new Account(client);

const database = new Databases(client);

export { client, database, ID };

