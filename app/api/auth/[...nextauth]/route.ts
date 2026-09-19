import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      try {
        const client = await pool.connect();
        const cleanEmail = user.email.toLowerCase().trim();
        
        const existingUser = await client.query(
          'SELECT * FROM "User" WHERE LOWER(email) = $1', 
          [cleanEmail]
        );

        if (existingUser.rows.length === 0) {
          await client.query(
            'INSERT INTO "User" (email, name, "isPro") VALUES ($1, $2, false)',
            [cleanEmail, user.name]
          );
        }
        client.release();
        return true;
      } catch (error) {
        console.error("Database error during sign in:", error);
        return true; 
      }
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          const client = await pool.connect();
          const cleanEmail = token.email.toLowerCase().trim();
          
          const result = await client.query(
            'SELECT "isPro", "proExpiresAt" FROM "User" WHERE LOWER(email) = $1',
            [cleanEmail]
          );
          client.release();

          if (result.rows.length > 0) {
            const userRecord = result.rows[0];
            const now = new Date();
            const expiresAt = userRecord.proExpiresAt ? new Date(userRecord.proExpiresAt) : null;

            // Check if active Pro AND expiration date is still valid
            const activePro = Boolean(userRecord.isPro && expiresAt && expiresAt > now);

            // Lazy evaluation: If database says isPro=true, but expiration has passed, downgrade immediately
            if (userRecord.isPro && expiresAt && expiresAt <= now) {
              const downgradeClient = await pool.connect();
              try {
                await downgradeClient.query(
                  'UPDATE "User" SET "isPro" = false, "proExpiresAt" = NULL WHERE LOWER(email) = $1',
                  [cleanEmail]
                );
              } finally {
                downgradeClient.release();
              }
              token.isPro = false;
            } else {
              token.isPro = activePro;
            }
          }
        } catch (error) {
          console.error("Error fetching pro status for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isPro = token.isPro || false;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };