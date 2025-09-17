import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getCurrentSession() {
  try {
    const session = await getServerSession(authOptions);
    return session || null;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

export async function getCurrentUserWithDetails() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_agency_memberships!inner (
          *,
          agencies:agency_id (
            *,
            subaccounts (*)
          )
        ),
        subaccount_users!inner (
          *,
          subaccounts:subaccount_id (
            *,
            agencies:agency_id (*)
          )
        )
      `)
      .eq('id', session.user.id)
      .single();

    if (error || !user) return null;

    return {
      ...user,
      ...session.user
    };
  } catch (error) {
    console.error('Error getting user with details:', error);
    return null;
  }
}

export async function hasAgencyAccess(agencyId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return false;

    const { data, error } = await supabaseAdmin
      .from('user_agency_memberships')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('agency_id', agencyId)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error('Error checking agency access:', error);
    return false;
  }
}

export async function hasSubaccountAccess(subaccountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return false;

    // Check direct subaccount access
    const { data: directAccess } = await supabaseAdmin
      .from('subaccount_users')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('subaccount_id', subaccountId)
      .single();

    if (directAccess) return true;

    // Check agency access (agency admins can access subaccounts)
    const { data: subaccount } = await supabaseAdmin
      .from('subaccounts')
      .select('agency_id')
      .eq('id', subaccountId)
      .single();

    if (subaccount) {
      return await hasAgencyAccess(subaccount.agency_id);
    }

    return false;
  } catch (error) {
    console.error('Error checking subaccount access:', error);
    return false;
  }
}

export function isAgencyAdmin(session: any) {
  return session?.user?.role === 'AGENCY_ADMIN';
}

export function isSubaccountUser(session: any) {
  return session?.user?.role === 'SUBACCOUNT_USER';
}

export async function getUserSubaccounts(userId?: string) {
  try {
    const session = await getServerSession(authOptions);
    const targetUserId = userId || session?.user?.id;
    
    if (!targetUserId) return [];

    const { data: subaccounts, error } = await supabaseAdmin
      .from('subaccount_users')
      .select(`
        subaccounts:subaccount_id (
          *,
          agencies:agency_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', targetUserId);

    if (error) {
      console.error('Error getting user subaccounts:', error);
      return [];
    }

    return subaccounts?.map(item => item.subaccounts).filter(Boolean) || [];
  } catch (error) {
    console.error('Error getting user subaccounts:', error);
    return [];
  }
}