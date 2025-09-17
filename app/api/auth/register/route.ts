import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, role, businessName } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !role || !businessName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Supabase
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        locale: 'en'
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // If user is a subaccount admin, create agency and subaccount
    if (role === 'subaccount_admin' && businessName) {
      // Create agency first
      const { data: agency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .insert({
          name: `${businessName} Agency`,
          slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (agencyError) {
        console.error('Agency creation error:', agencyError);
        // Cleanup user if agency creation fails
        await supabaseAdmin.from('users').delete().eq('id', newUser.id);
        return NextResponse.json(
          { error: 'Failed to create agency' },
          { status: 500 }
        );
      }

      // Create subaccount
      const { data: subaccount, error: subaccountError } = await supabaseAdmin
        .from('subaccounts')
        .insert({
          agency_id: agency.id,
          name: businessName,
          slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (subaccountError) {
        console.error('Subaccount creation error:', subaccountError);
        // Cleanup user and agency if subaccount creation fails
        await supabaseAdmin.from('agencies').delete().eq('id', agency.id);
        await supabaseAdmin.from('users').delete().eq('id', newUser.id);
        return NextResponse.json(
          { error: 'Failed to create business account' },
          { status: 500 }
        );
      }

      // Create agency membership
      const { error: membershipError } = await supabaseAdmin
        .from('user_agency_memberships')
        .insert({
          user_id: newUser.id,
          agency_id: agency.id,
          role: 'AGENCY_ADMIN'
        });

      if (membershipError) {
        console.error('Agency membership error:', membershipError);
        // Note: We continue here as the core entities are created
      }

      // Create subaccount access
      const { error: accessError } = await supabaseAdmin
        .from('subaccount_users')
        .insert({
          user_id: newUser.id,
          subaccount_id: subaccount.id,
          role: 'SUBACCOUNT_ADMIN'
        });

      if (accessError) {
        console.error('Subaccount access error:', accessError);
        // Note: We continue here as the core entities are created
      }
    }

    return NextResponse.json(
      { 
        message: 'Registration successful! You can now sign in with your credentials.',
        success: true 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}