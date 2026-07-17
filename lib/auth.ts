import dns from 'node:dns'
dns.setDefaultResultOrder('ipv4first')
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

// Singleton client to avoid creating multiple connections in development
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

let client: MongoClient;
if (!globalWithMongo._mongoClient) {
  client = new MongoClient(uri);
  globalWithMongo._mongoClient = client;
} else {
  client = globalWithMongo._mongoClient;
}

const db = client.db("fittrack");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  database: mongodbAdapter(db, {
    client,
    // Atlas free tier uses replica sets so transactions are supported.
    // Set to false if using standalone MongoDB without replica set.
    transaction: true,
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
