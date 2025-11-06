'use client';

import React from 'react';
import { GithubOutlined, TwitterOutlined, LinkedinOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <SafetyCertificateOutlined className="text-sm text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Э-Нотолгоо</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Блокчэйн дээр суурилсан аюулгүй гэрээ болон гэрчилгээ баталгаажуулах платформ. 
              Төвлөрсөн бус технологиор жинхэнэ байдал болон итгэлцлийг хангана.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                <GithubOutlined className="text-lg" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                <TwitterOutlined className="text-lg" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                <LinkedinOutlined className="text-lg" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Бүтээгдэхүүн</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Хэрхэн ажилладаг
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Үнийн төлөвлөгөө
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                API баримт бичиг
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Аюулгүй байдал
              </Link>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Дэмжлэг</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Тусламжийн төв
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Бидэнтэй холбогдох
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Нууцлалын бодлого
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-blue-600 transition-colors">
                Үйлчилгээний нөхцөл
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 Э-Нотолгоо. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <p className="text-gray-500 text-sm mt-2 sm:mt-0">
              Аюулгүй байдал болон итгэлцлийг харгалзан бүтээгдсэн
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};