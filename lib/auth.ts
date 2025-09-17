import { NextAuthOptions } from 'next-auth';
import { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      agencyId?: string;
      subaccountId?: string;
      agencyRole?: string;
      subaccountRole?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    agencyId?: string;
    subaccountId?: string;
    agencyRole?: string;
    subaccountRole?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    agencyId?: string;
    subaccountId?: string;
    agencyRole?: string;
    subaccountRole?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user in Supabase
          const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (userError || !user || !user.password) {
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Get user's agency memberships
          const { data: agencyMemberships } = await supabaseAdmin
            .from('user_agency_memberships')
            .select(`
              *,
              agencies:agency_id (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', user.id);

          // Get user's subaccount access
          const { data: subaccountAccess } = await supabaseAdmin
            .from('subaccount_users')
            .select(`
              *,
              subaccounts:subaccount_id (
                id,
                name,
                slug
              )
            `)
            .eq('user_id', user.id);

          // Determine user's primary role and access
          const agencyMembership = agencyMemberships?.[0];
          const subaccountAccessItem = subaccountAccess?.[0];
          
          let role = 'USER';
          let agencyId = undefined;
          let subaccountId = undefined;
          let agencyRole = undefined;
          let subaccountRole = undefined;

          if (agencyMembership) {
            role = 'AGENCY_USER';
            agencyId = agencyMembership.agency_id;
            agencyRole = agencyMembership.role;
            
            if (agencyMembership.role === 'AGENCY_ADMIN') {
              role = 'AGENCY_ADMIN';
            }
          }

          if (subaccountAccessItem) {
            subaccountId = subaccountAccessItem.subaccount_id;
            subaccountRole = subaccountAccessItem.role;
            
            if (!agencyMembership) {
              role = 'SUBACCOUNT_USER';
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role,
            agencyId,
            subaccountId,
            agencyRole,
            subaccountRole,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.subaccountId = user.subaccountId;
        token.agencyRole = user.agencyRole;
        token.subaccountRole = user.subaccountRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agencyId = token.agencyId;
        session.user.subaccountId = token.subaccountId;
        session.user.agencyRole = token.agencyRole;
        session.user.subaccountRole = token.subaccountRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export auth options for use in API routes