import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LocationsTab from './assets/LocationsTab';
import AssetsTab from './assets/AssetsTab';

type Tab = 'locations' | 'assets';

export default function AssetsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const isAdmin = user?.role === 'ADMIN';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'locations', label: 'Locations' },
    { key: 'assets', label: 'Assets' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Assets Management</h2>
        <p className="text-gray-500 mt-1">Manage locations and assets across your organization.</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'locations' && <LocationsTab isAdmin={isAdmin} />}
      {activeTab === 'assets' && <AssetsTab isAdmin={isAdmin} />}
    </div>
  );
}