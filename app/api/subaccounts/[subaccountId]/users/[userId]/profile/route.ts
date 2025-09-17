import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { subaccountId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subaccountId, userId } = params;

    // 1. Verify access to the subaccount for the current session user
    const { data: subaccountUserAccess, error: accessError } = await supabaseAdmin
      .from('subaccount_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('subaccount_id', subaccountId)
      .single();

    // If not a direct subaccount user, check if agency admin
    let isAgencyAdmin = false;
    if (!subaccountUserAccess) {
      const { data: agencyMembership } = await supabaseAdmin
        .from('user_agency_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('agency_id', session.user.agencyId) // Assuming agencyId is in session for agency admins
        .single();
      
      if (agencyMembership?.role === 'AGENCY_ADMIN') {
        isAgencyAdmin = true;
      }
    }

    if (!subaccountUserAccess && !isAgencyAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view this subaccount' }, { status: 403 });
    }

    // 2. Fetch the target user's details and their subaccount role
    const { data: targetUserWithRole, error: fetchError } = await supabaseAdmin
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
      .eq('subaccount_id', subaccountId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !targetUserWithRole?.users) {
      console.error('Error fetching target user:', fetchError);
      return NextResponse.json({ error: 'User not found in this subaccount' }, { status: 404 });
    }

    const isCurrentUser = session.user.id === userId;
    const sessionUserRole = subaccountUserAccess?.role; // Role of the user making the request within the subaccount

    const canEdit = isCurrentUser || 
                    isAgencyAdmin || 
                    sessionUserRole === 'SUBACCOUNT_ADMIN';

    const userProfile = {
      id: targetUserWithRole.users.id,
      email: targetUserWithRole.users.email,
      name: targetUserWithRole.users.name,
      subaccountRole: targetUserWithRole.role,
      isCurrentUser,
      canEdit,
    };

    return NextResponse.json(userProfile, { status: 200 });
  } catch (error) {
    console.error('API error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { subaccountId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subaccountId, userId } = params;
    const { name, email, password } = await request.json(); // Added password

    // Authorization check for editing
    const isCurrentUser = session.user.id === userId;

    const { data: sessionUserSubaccountAccess } = await supabaseAdmin
      .from('subaccount_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('subaccount_id', subaccountId)
      .single();

    let isSessionUserSubaccountAdmin = sessionUserSubaccountAccess?.role === 'SUBACCOUNT_ADMIN';

    const { data: sessionUserAgencyMembership } = await supabaseAdmin
      .from('user_agency_memberships')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('agency_id', session.user.agencyId) // Assuming agencyId is in session for agency admins
      .single();
    
    let isSessionUserAgencyAdmin = sessionUserAgencyMembership?.role === 'AGENCY_ADMIN';

    if (!isCurrentUser && !isSessionUserSubaccountAdmin && !isSessionUserAgencyAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update this profile' }, { status: 403 });
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Only update password if provided and not empty
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Update user in Supabase
    const { data, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}