import { ReceiverDashboard } from '@/components/receiver-dashboard';
import { fetchCharityData } from '@/lib/charities';

interface PageProps {
  params: { address: string };
}

export default async function DashboardPage({ params }: PageProps) {
  const data = await fetchCharityData(params.address).catch((error) => {console.log(error)});
  return <ReceiverDashboard initialData={data || {charity: {address: '', name: '', description:'', totalReceived: 0, verified: false}, donations: []}} />;
}