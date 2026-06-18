import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { LibSQLAdapter } from "@auth/libsql-adapter";
import { getDbClient } from "@tactico/database";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: LibSQLAdapter(getDbClient()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
