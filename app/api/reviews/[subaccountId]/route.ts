import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    const subaccountId = params.subaccountId;

    // Fetch subaccount data and settings
    console.log('Fetching subaccount:', subaccountId);
    const { data: subaccount, error: subaccountError } = await supabaseAdmin
      .from('subaccounts')
      .select(`
        id,
        name,
        logo,
        status,
        subaccount_settings (
          google_review_link,
          review_threshold,
          thank_you_message
        )
      `)
      .eq('id', subaccountId)
      .single();
    
    console.log('Subaccount query result:', { subaccount, subaccountError });

    if (subaccountError || !subaccount) {
      return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 });
    }

    // Return the data needed for the review form
    return NextResponse.json({
      id: subaccount.id,
      businessName: subaccount.name,
      logoUrl: subaccount.logo,
      isActive: subaccount.status === 'active',
      googleReviewLink: subaccount.subaccount_settings?.[0]?.google_review_link,
      reviewThreshold: subaccount.subaccount_settings?.[0]?.review_threshold || 4,
      thankYouMessage: subaccount.subaccount_settings?.[0]?.thank_you_message || 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error fetching subaccount data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    const subaccountId = params.subaccountId;
    const body = await request.json();
    
    const { rating, subject, comment, customerName, customerEmail, customerPhone } = body;

    // Validate required fields
    if (!rating || !subject || !comment || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if subaccount exists
    const { data: subaccount, error: subaccountError } = await supabaseAdmin
      .from('subaccounts')
      .select('id')
      .eq('id', subaccountId)
      .single();

    if (subaccountError || !subaccount) {
      return NextResponse.json({ error: 'Subaccount not found' }, { status: 404 });
    }

    // Check if customer already submitted a review
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('subaccount_id', subaccountId)
      .eq('customer_email', customerEmail)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: 'You have already submitted a review for this business' }, { status: 400 });
    }

    // Create the review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert({
        rating,
        subject,
        comment,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        subaccount_id: subaccountId,
        status: 'PENDING'
      })
      .select('id')
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully',
      reviewId: review.id 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}