import { db } from '../config';
import { Charity, Donation } from '../app/types';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore';

export async function fetchCharities(): Promise<Charity[]> {
  const q = query(collection(db, 'charities'), where('verified', '==', true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      address: data.address,
      name: data.name,
      description: data.description,
      verified: data.verified,
      totalReceived: data.totalReceived || 0,
      imageUrl: data.imageUrl,
    };
  });
}

export async function fetchCharityData(address: string): Promise<{
  charity: Charity;
  donations: Donation[];
}> {
  if (!address) {
    return {charity: {address: '', name: '', description:'', totalReceived: 0, verified: false}, donations: []}
  }
  const charityRef = doc(db, 'charities', address);
  const charitySnapshot = await getDoc(charityRef);

  if (!charitySnapshot.exists()) {
    console.log('Charity not found');
    return {charity: {address: '', name: '', description:'', totalReceived: 0, verified: false}, donations: []}
  }

  const donationsRef = collection(db, 'donations');
  const donationsQuery = query(
    donationsRef,
    where('charityAddress', '==', address),
    orderBy('timestamp', 'desc')
  );
  const donationsSnapshot = await getDocs(donationsQuery);

  const charityData = charitySnapshot.data();
  const charity: Charity = {
    address,
    name: charityData?.name || '',
    description: charityData?.description || '',
    verified: charityData?.verified || false,
    totalReceived: charityData?.totalReceived || 0,
    imageUrl: charityData?.imageUrl || '',
  };

  const donations: Donation[] = donationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      donorAddress: data.donorAddress,
      charityAddress: data.charityAddress,
      amount: data.amount,
      isSubscription: data.isSubscription,
      timestamp: data.timestamp.toDate(),
      txHash: data.txHash,
    };
  });

  return { charity, donations };
}