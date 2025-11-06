'use client';

import React from 'react';
import { ConfigProvider } from 'antd';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1e3a8a',
          colorLink: '#3b82f6',
          borderRadius: 8,
        },
      }}
      // Suppress React version warning since everything works fine
      warning={{
        strict: false,
      }}
    >
      {children}
    </ConfigProvider>
  );
}