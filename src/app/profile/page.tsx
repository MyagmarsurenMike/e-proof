'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

const ProfileContent = dynamic(() => import('./ProfileContent'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  ),
  ssr: false,
});

export default function ProfilePage() {
  return <ProfileContent />;
}
