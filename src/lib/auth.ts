import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      plan: string
    } & DefaultSession['user']
  }
  interface User {
    role?: string
    plan?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    plan?: string
  }
}

// In production, NEXTAUTH_SECRET must be set explicitly. Failing fast here
// prevents silently using an insecure fallback secret.
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. ' +
      'Please define it before running the application in production.'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!user) return null;

        let isValid = false;
        try {
          isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
        } catch {
          return null;
        }

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        if (token.role) session.user.role = token.role;
        if (token.plan) session.user.plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: nextAuthSecret,
};
