import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from '@neondatabase/serverless';

// Connect to your Neon database using the environment string
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
        // Check if user exists in Neon, if not, create them
        const client = await pool.connect();
        const existingUser = await client.query(
          'SELECT * FROM "User" WHERE email = $1', 
          [user.email]
        );

        if (existingUser.rows.length === 0) {
          await client.query(
            'INSERT INTO "User" (email, name, "isPro") VALUES ($1, $2, false)',
            [user.email, user.name]
          );
        }
        client.release();
        return true;
      } catch (error) {
        console.error("Database error during sign in:", error);
        return true; // Let them sign in even if DB sync fails temporarily
      }
    },
    async jwt({ token }) {
      // Fetch Pro status and expiration date from Neon
      if (token.email) {
        try {
          const client = await pool.connect();
          const result = await client.query(
            'SELECT "isPro", "proExpiresAt" FROM "User" WHERE email = $1',
            [token.email]
          );
          client.release();

          if (result.rows.length > 0) {
            const userRecord = result.rows[0];
            const now = new Date();
            const expiresAt = userRecord.proExpiresAt ? new Date(userRecord.proExpiresAt) : null;

            // User is truly Pro only if flagged as true AND expiration date is still in the future
            const activePro = Boolean(userRecord.isPro && expiresAt && expiresAt > now);
            token.isPro = activePro;
          }
        } catch (error) {
          console.error("Error fetching pro status for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose active isPro status to the client-side useSession() hook
      if (session.user) {
        (session.user as any).isPro = token.isPro || false;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };