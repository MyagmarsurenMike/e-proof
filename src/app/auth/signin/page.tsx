'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Card, Form, Input, Button, Alert, Divider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Имэйл хаяг эсвэл нууц үг буруу байна');
      } else {
        // Refresh session and redirect
        await getSession();
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo + title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Нэвтрэх</h1>
            <p className="text-sm text-[#64748b]">
              Э-Нотолгоо системд нэвтэрч баримт бичгээ удирдана уу
            </p>
          </div>

          <Card style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              {error && (
                <Alert message={error} type="error" showIcon className="mb-4" />
              )}

              <Form.Item
                name="email"
                label="Имэйл хаяг"
                rules={[
                  { required: true, message: 'Имэйл хаягаа оруулна уу' },
                  { type: 'email', message: 'Зөв имэйл хаяг оруулна уу' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="your@email.com" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Нууц үг"
                rules={[
                  { required: true, message: 'Нууц үгээ оруулна уу' },
                  { min: 6, message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Нууц үгээ оруулна уу" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className="w-full h-10">
                  Нэвтрэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <span className="text-sm text-[#64748b]">
                Бүртгэл байхгүй үү?{' '}
                <Link href="/auth/signup" className="text-[#1e3a8a]">
                  Бүртгүүлэх
                </Link>
              </span>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
