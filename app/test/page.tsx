'use client';

import { MetricCard } from '@/components/MetricCard';

export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Component Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="AI/Compute Exposure"
          value={65}
          previousValue={58}
          suffix="%"
          category="ai"
          confidence={0.93}
          insight="Portfolio is heavily weighted toward AI"
        />
        
        <MetricCard
          title="Robotics Potential"
          value={28}
          previousValue={15}
          suffix="%"
          category="robotics"
          confidence={0.87}
          insight="Tesla driving robotics exposure"
        />
      </div>
    </div>
  );
} 