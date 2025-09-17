import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser, hasSubaccountAccess } from '@/lib/session-stub';

export async function GET(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    // Verify subaccount exists and get settings
    const { data: subaccount, error: subaccountError } = await supabaseAdmin
      .from('subaccounts')
      .select('id, name')
      .eq('id', params.subaccountId)
      .single();

    if (subaccountError || !subaccount) {
      return NextResponse.json(
        { error: 'Subaccount not found' },
        { status: 404 }
      );
    }

    const { data: settings } = await supabaseAdmin
      .from('subaccount_settings')
      .select('*')
      .eq('subaccount_id', params.subaccountId)
      .single();

    // Return relevant settings for the review form
    const settingsData = {
      businessName: settings?.business_name || subaccount.name,
      logoUrl: settings?.logo_url || null,
      googleReviewLink: settings?.google_review_link || null,
      reviewThreshold: settings?.review_threshold || 4,
      primaryColor: settings?.primary_color || '#3B82F6',
      thankYouMessage: settings?.thank_you_message || null,
    };

    return NextResponse.json({ settings: settingsData });

  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check access to this subaccount
    const hasAccess = await hasSubaccountAccess(params.subaccountId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields and types
    const updates: any = {};
    
    if (body.businessName !== undefined) {
      if (typeof body.businessName !== 'string' || body.businessName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Business name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.businessName = body.businessName.trim();
    }
    
    if (body.businessType !== undefined) {
      if (body.businessType && typeof body.businessType !== 'string') {
        return NextResponse.json(
          { error: 'Business type must be a string' },
          { status: 400 }
        );
      }
      updates.businessType = body.businessType?.trim() || null;
    }
    
    if (body.address !== undefined) {
      updates.address = body.address?.trim() || null;
    }
    
    if (body.city !== undefined) {
      updates.city = body.city?.trim() || null;
    }
    
    if (body.state !== undefined) {
      updates.state = body.state?.trim() || null;
    }
    
    if (body.zipCode !== undefined) {
      updates.zipCode = body.zipCode?.trim() || null;
    }
    
    if (body.country !== undefined) {
      updates.country = body.country?.trim() || 'US';
    }
    
    if (body.googleReviewLink !== undefined) {
      if (body.googleReviewLink && !body.googleReviewLink.startsWith('http')) {
        return NextResponse.json(
          { error: 'Google review link must be a valid URL' },
          { status: 400 }
        );
      }
      updates.googleReviewLink = body.googleReviewLink?.trim() || null;
    }
    
    if (body.reviewThreshold !== undefined) {
      const threshold = parseInt(body.reviewThreshold);
      if (isNaN(threshold) || threshold < 1 || threshold > 5) {
        return NextResponse.json(
          { error: 'Review threshold must be a number between 1 and 5' },
          { status: 400 }
        );
      }
      updates.reviewThreshold = threshold;
    }
    
    if (body.primaryColor !== undefined) {
      if (body.primaryColor && !/^#[0-9A-F]{6}$/i.test(body.primaryColor)) {
        return NextResponse.json(
          { error: 'Primary color must be a valid hex color code' },
          { status: 400 }
        );
      }
      updates.primaryColor = body.primaryColor || '#3B82F6';
    }
    
    if (body.thankYouMessage !== undefined) {
      updates.thankYouMessage = body.thankYouMessage?.trim() || null;
    }
    
    if (body.logoUrl !== undefined) {
      updates.logoUrl = body.logoUrl?.trim() || null;
    }
    
    if (body.timezone !== undefined) {
      updates.timezone = body.timezone?.trim() || 'UTC';
    }
    
    if (body.emailNotifications !== undefined) {
      updates.emailNotifications = Boolean(body.emailNotifications);
    }
    
    if (body.enableReviews !== undefined) {
      updates.enableReviews = Boolean(body.enableReviews);
    }

    // Verify subaccount exists
    const { data: subaccount } = await supabaseAdmin
      .from('subaccounts')
      .select('id, name')
      .eq('id', params.subaccountId)
      .single();

    if (!subaccount) {
      return NextResponse.json(
        { error: 'Subaccount not found' },
        { status: 404 }
      );
    }

    // Get existing settings
    const { data: existingSettings } = await supabaseAdmin
      .from('subaccount_settings')
      .select('*')
      .eq('subaccount_id', params.subaccountId)
      .single();

    let settings;
    if (!existingSettings) {
      // Create new settings
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('subaccount_settings')
        .insert({
          subaccount_id: params.subaccountId,
          business_name: updates.businessName || subaccount.name,
          logo_url: updates.logoUrl,
          google_review_link: updates.googleReviewLink,
          review_threshold: updates.reviewThreshold || 4,
          primary_color: updates.primaryColor || '#3B82F6',
          thank_you_message: updates.thankYouMessage,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Settings creation error:', createError);
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        );
      }
      settings = newSettings;
    } else {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabaseAdmin
        .from('subaccount_settings')
        .update({
          business_name: updates.businessName || subaccount.name,
          logo_url: updates.logoUrl,
          google_review_link: updates.googleReviewLink,
          review_threshold: updates.reviewThreshold || 4,
          primary_color: updates.primaryColor || '#3B82F6',
          thank_you_message: updates.thankYouMessage,
        })
        .eq('subaccount_id', params.subaccountId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Settings update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        );
      }
      settings = updatedSettings;
    }

    return NextResponse.json({ 
      success: true,
      settings: {
        businessName: settings.businessName,
        businessType: settings.businessType,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zipCode: settings.zipCode,
        country: settings.country,
        logoUrl: settings.logoUrl,
        googleReviewLink: settings.googleReviewLink,
        reviewThreshold: settings.reviewThreshold,
        primaryColor: settings.primaryColor,
        thankYouMessage: settings.thankYouMessage,
        timezone: settings.timezone,
        emailNotifications: settings.emailNotifications,
        enableReviews: settings.enableReviews,
      }
    });

  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}