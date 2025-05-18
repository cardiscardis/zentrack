// app/api/get-donations/route.ts
import { db } from '../../config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { Donation } from '../types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    );
  }

  try {
    const q = query(
      collection(db, 'donations'),
      where('charityAddress', '==', address),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);

    const donations: Donation[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        donorAddress: data.donorAddress,
        charityAddress: data.charityAddress,
        amount: data.amount,
        isSubscription: data.isSubscription,
        timestamp: data.timestamp.toDate?.() ?? new Date(data.timestamp),
        txHash: data.txHash,
      };
    });

    return NextResponse.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
