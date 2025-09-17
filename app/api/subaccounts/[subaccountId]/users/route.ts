import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subaccountId } = params;

    // Check if the current user has access to this subaccount
    const { data: subaccountAccess, error: accessError } = await supabaseAdmin
      .from('subaccount_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('subaccount_id', subaccountId)
      .single();

    // If the user is not directly linked to the subaccount, check if they are an agency admin
    if (!subaccountAccess) {
      const { data: agencyMembership, error: agencyError } = await supabaseAdmin
        .from('user_agency_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('agency_id', session.user.agencyId) // Assuming agencyId is in session for agency admins
        .single();

      if (!agencyMembership || agencyMembership.role !== 'AGENCY_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }
    }

    // If access is granted, fetch users for the subaccount
    const { data: subaccountUsers, error: fetchError } = await supabaseAdmin
      .from('subaccount_users')
      .select(`
        role,
        users:user_id (
          id,
          name,
          email,
          created_at
        )
      `)
      .eq('subaccount_id', subaccountId);

    if (fetchError) {
      console.error('Error fetching subaccount users:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subaccount users' }, { status: 500 });
    }

    const users = subaccountUsers?.map(su => ({
      id: su.users?.id,
      name: su.users?.name,
      email: su.users?.email,
      role: su.role, // This is the subaccount-specific role
      created_at: su.users?.created_at,
    })) || [];

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('API error fetching subaccount users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}