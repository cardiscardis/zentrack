"use client"
import { useState, useEffect } from 'react';
import { useAccount, useContract } from 'wagmi';
import { ethers } from 'ethers';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import DonationContractABI from '../../lib/abis/DonationContractABI.json';
import { Charity, Donation } from '../types';
import { useOnchainKit } from '@coinbase/onchainkit';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ReceiverDashboard() {
  const { address } = useAccount();
  const { getIdentity } = useOnchainKit();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const contract = useContract({
    address: process.env.NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS as `0x${string}`,
    abi: DonationContractABI,
  });

  useEffect(() => {
    if (address) {
      fetchData();
      fetchIdentity();
    }
  }, [address]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch on-chain data
      const [totalReceived, verified] = await Promise.all([
        contract?.getCharityDonations(address),
        contract?.charities(address),
      ]);

      // Fetch off-chain data
      const donationsRes = await fetch(`/api/receiver/donations?address=${address}`);
      const donationsData = await donationsRes.json();

      setCharity({
        address,
        name: verified.name,
        description: verified.description,
        totalReceived: parseFloat(ethers.formatEther(totalReceived)),
        verified: verified.verified,
      });

      setDonations(donationsData.map((d: any) => ({
        ...d,
        timestamp: new Date(d.timestamp),
      })));
    } catch (error) {
      toast.error('Failed to load charity data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIdentity = async () => {
    try {
      const id = await getIdentity(address as `0x${string}`);
      setIdentity(id);
    } catch (error) {
      console.log('No identity found');
    }
  };

  const chartData = {
    labels: ['One-time', 'Recurring'],
    datasets: [
      {
        data: [
          donations.filter(d => !d.isSubscription).length,
          donations.filter(d => d.isSubscription).length,
        ],
        backgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!charity) return <div className="text-center py-8">Not registered as a charity</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Charity Dashboard</h1>
        {identity?.image && (
          <img 
            src={identity.image} 
            alt={charity.name} 
            className="w-16 h-16 rounded-full"
          />
        )}
      </div>

      <div className="stats shadow mb-8 w-full">
        <div className="stat">
          <div className="stat-title">Total Received</div>
          <div className="stat-value">{charity.totalReceived} ETH</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Total Donations</div>
          <div className="stat-value">{donations.length}</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Status</div>
          <div className="stat-value">
            {charity.verified ? 'Verified' : 'Pending'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Donation Types</h2>
            <div className="h-64">
              <Pie data={chartData} />
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Charity Information</h2>
            <p>{charity.description}</p>
            {identity?.attributes?.map((attr: any, index: number) => (
              <div key={index} className="mt-2">
                <span className="font-semibold">{attr.trait_type}:</span> {attr.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Recent Donations</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 5).map((donation, index) => (
                  <tr key={index}>
                    <td>{shortenAddress(donation.donorAddress)}</td>
                    <td>{donation.amount} ETH</td>
                    <td>{donation.isSubscription ? 'Recurring' : 'One-time'}</td>
                    <td>{donation.timestamp.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortenAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}