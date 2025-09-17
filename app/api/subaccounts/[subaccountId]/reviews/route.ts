import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { subaccountId: string } }
) {
  try {
    const body = await request.json();
    const { rating, name, email, subject, comment } = body;

    // Validate required fields
    if (!rating || !name || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify subaccount exists
    const { data: subaccount, error: subaccountError } = await supabaseAdmin
      .from('subaccounts')
      .select('id')
      .eq('id', params.subaccountId)
      .single();

    if (subaccountError || !subaccount) {
      return NextResponse.json(
        { error: 'Subaccount not found' },
        { status: 404 }
      );
    }

    // Create review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert({
        subaccount_id: params.subaccountId,
        customer_name: name,
        customer_email: email || null,
        subject: subject || null,
        comment,
        rating,
        status: rating >= 4 ? 'APPROVED' : 'PENDING', // High ratings auto-approve
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Determine response based on rating
    const isPositive = rating >= 4;
    
    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        isPositive,
      },
      message: isPositive 
        ? 'Thank you for your positive feedback! We may redirect you to leave a public review.'
        : 'Thank you for your feedback! We will use this to improve our service.',
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}