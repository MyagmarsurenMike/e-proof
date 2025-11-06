'use client';

import React from 'react';
import { Button, Menu, Avatar, Dropdown } from 'antd';
import { WalletOutlined, SafetyCertificateOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Профайл',
      icon: <UserOutlined />,
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'signout',
      label: 'Гарах',
      icon: <LogoutOutlined />,
      onClick: handleSignOut,
    },
  ];

  return (
    <header className="bg-blue-800 px-4 sm:px-6 lg:px-8 h-16 border-b border-gray-200">
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
              <SafetyCertificateOutlined className="text-xl text-blue-600" />
            </div>
            <h1 className="text-white text-xl font-bold hidden sm:block">
              Э-Нотолгоо
            </h1>
          </Link>
        </div>

        {/* Navigation Menu - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-white hover:text-gray-200 font-medium transition-colors">
            Нүүр
          </Link>
          <Link href="/verify" className="text-white hover:text-gray-200 font-medium transition-colors">
            Баталгаажуулах
          </Link>
          {session && (
            <Link href="/dashboard" className="text-white hover:text-gray-200 font-medium transition-colors">
              Хяналтын самбар
            </Link>
          )}
        </nav>

        {/* Navigation and Actions */}
        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
          ) : session ? (
            <>
              {/* Connect Wallet Button */}
              <button className="hidden lg:flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white rounded-md hover:bg-white/20 transition-colors">
                <WalletOutlined className="mr-2" />
                Түрийвч холбох
              </button>
              
              {/* User Menu */}
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <button className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-md hover:bg-white/20 transition-colors">
                  <Avatar
                    size="small"
                    src={session.user?.image}
                    icon={<UserOutlined />}
                    className="bg-blue-600"
                  />
                  <span className="hidden sm:block font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>
              </Dropdown>
            </>
          ) : (
            <>
              {/* Sign In Button */}
              <Link href="/auth/signin">
                <button className="hidden sm:flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white rounded-md hover:bg-white/20 transition-colors">
                  <UserOutlined className="mr-2" />
                  Нэвтрэх
                </button>
              </Link>
              
              {/* Sign Up Button */}
              <Link href="/auth/signup">
                <button className="flex items-center px-4 py-2 bg-white text-blue-800 rounded-md hover:bg-gray-100 transition-colors font-medium">
                  Бүртгүүлэх
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};