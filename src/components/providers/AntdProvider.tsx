'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import '@ant-design/v5-patch-for-react-19';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1e3a8a',
          colorLink: '#1e3a8a',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
          boxShadow: 'none',
          boxShadowSecondary: 'none',
        },
      }}
      warning={{ strict: false }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
