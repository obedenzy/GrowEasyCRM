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
      role: string; // This will now reflect the primary role (e.g., SUBACCOUNT_ADMIN)
      agencyId?: string;
      subaccountId?: string;
      agencyRole?: string; // Specific role within agency membership
      subaccountRole?: string; // Specific role within subaccount access
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

// console.log('NEXTAUTH_SECRET in lib/auth.ts:', process.env.NEXTAUTH_SECRET); // Removed after debugging

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
          
          let primaryRole: string = 'USER'; // Default role
          let userAgencyId: string | undefined = undefined;
          let userSubaccountId: string | undefined = undefined;
          let userAgencyRole: string | undefined = undefined;
          let userSubaccountRole: string | undefined = undefined;

          if (agencyMembership) {
            userAgencyId = agencyMembership.agency_id;
            userAgencyRole = agencyMembership.role; // e.g., 'AGENCY_MEMBER', 'AGENCY_ADMIN'
            // Always set agencyId if membership exists, regardless of primary role
            // This ensures it's available for checks in middleware/API routes
          }

          if (subaccountAccessItem) {
            userSubaccountId = subaccountAccessItem.subaccount_id;
            userSubaccountRole = subaccountAccessItem.role; // e.g., 'SUBACCOUNT_ADMIN', 'SUBACCOUNT_USER'
          }

          // Prioritize subaccount role for the main 'role' field if subaccount access exists
          if (userSubaccountRole) {
            primaryRole = userSubaccountRole; // This will be 'SUBACCOUNT_ADMIN' or 'SUBACCOUNT_USER'
          } else if (userAgencyRole) {
            primaryRole = userAgencyRole; // Fallback to agency role if no subaccount role
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: primaryRole, // Use the determined primary role
            agencyId: userAgencyId, // Ensure agencyId is set if found
            subaccountId: userSubaccountId,
            agencyRole: userAgencyRole,
            subaccountRole: userSubaccountRole,
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