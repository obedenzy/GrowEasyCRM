import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, subaccountName } = body; // Updated to subaccountName, removed role

    // Validation
    if (!name || !email || !password || !confirmPassword || !subaccountName) { // Updated validation
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

    // All signups are subaccount users, belonging to the default agency.
    const DEFAULT_AGENCY_ID = '550e8400-e29b-41d4-a716-446655440000'; // Hardcoded default agency ID

    // Create subaccount for the new business
    const { data: subaccount, error: subaccountError } = await supabaseAdmin
      .from('subaccounts')
      .insert({
        agency_id: DEFAULT_AGENCY_ID,
        name: subaccountName,
        slug: subaccountName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        status: 'active'
      })
      .select()
      .single();

    if (subaccountError) {
      console.error('Subaccount creation error:', subaccountError);
      // Cleanup user if subaccount creation fails
      await supabaseAdmin.from('users').delete().eq('id', newUser.id);
      return NextResponse.json(
        { error: 'Failed to create business account' },
        { status: 500 }
      );
    }

    // Create default subaccount settings
    const { error: settingsError } = await supabaseAdmin
      .from('subaccount_settings')
      .insert({
        subaccount_id: subaccount.id,
        review_threshold: 4, // Default value
        thank_you_message: 'Thank you for your feedback!' // Default message
      });

    if (settingsError) {
      console.error('Subaccount settings creation error:', settingsError);
      // Log the error but don't block registration, as settings can be updated later.
    }

    // Link the new user to the created subaccount as a SUBACCOUNT_ADMIN
    const { error: accessError } = await supabaseAdmin
      .from('subaccount_users')
      .insert({
        user_id: newUser.id,
        subaccount_id: subaccount.id,
        role: 'SUBACCOUNT_ADMIN' // Default role for signup
      });

    if (accessError) {
      console.error('Subaccount access error:', accessError);
      // Note: We continue here as the core entities are created
    }

    // Also link the new user to the default agency as an AGENCY_MEMBER
    const { error: agencyMembershipError } = await supabaseAdmin
      .from('user_agency_memberships')
      .insert({
        user_id: newUser.id,
        agency_id: DEFAULT_AGENCY_ID,
        role: 'AGENCY_MEMBER' // All subaccount users are members of the default agency
      });
    
    if (agencyMembershipError) {
      console.error('Agency membership error:', agencyMembershipError);
      // Note: We continue here as the core entities are created
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