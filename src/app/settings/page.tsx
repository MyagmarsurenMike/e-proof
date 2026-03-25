'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

const SettingsContent = dynamic(() => import('./SettingsContent'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  ),
  ssr: false,
});

export default function SettingsPage() {
  return <SettingsContent />;
}
