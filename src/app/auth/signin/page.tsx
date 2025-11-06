'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { Card, Form, Input, Button, Alert, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

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
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Title level={2} className="mb-2">
              Нэвтрэх
            </Title>
            <Text className="text-gray-600">
              Э-Нотолгоо системд нэвтэрч, баримт бичгээ баталгаажуулна уу
            </Text>
          </div>

          <Card className="shadow-lg border-0">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  className="mb-4"
                />
              )}

              <Form.Item
                name="email"
                label="Имэйл хаяг"
                rules={[
                  { required: true, message: 'Имэйл хаягаа оруулна уу' },
                  { type: 'email', message: 'Зөв имэйл хаяг оруулна уу' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="your@email.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Нууц үг"
                rules={[
                  { required: true, message: 'Нууц үгээ оруулна уу' },
                  { min: 6, message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Нууц үгээ оруулна уу"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full h-12"
                >
                  Нэвтрэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <Text className="text-gray-600">
                Бүртгэл байхгүй үү?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
                  Бүртгүүлэх
                </Link>
              </Text>
            </div>
          </Card>

          <div className="text-center">
            <Text className="text-gray-500 text-sm">
              Нэвтрэх нь манай{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                Үйлчилгээний нөхцөл
              </Link>{' '}
              болон{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                Нууцлалын бодлого
              </Link>-г хүлээн зөвшөөрч байна гэсэн үг юм.
            </Text>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}