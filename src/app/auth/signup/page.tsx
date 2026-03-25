'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Divider, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined } from '@ant-design/icons';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Option } = Select;

export default function SignUp() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Бүртгэлд алдаа гарлаа');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Бүртгэлд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Бүртгүүлэх</h1>
            <p className="text-sm text-[#64748b]">Э-Нотолгоо системд шинэ бүртгэл үүсгээрэй</p>
          </div>

          <Card style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              {error && (
                <Alert message={error} type="error" showIcon className="mb-4" />
              )}
              {success && (
                <Alert
                  message="Бүртгэл амжилттай үүсгэгдлээ!"
                  description="Нэвтрэх хуудас руу шилжүүлж байна..."
                  type="success"
                  showIcon
                  className="mb-4"
                />
              )}

              <Form.Item
                name="name"
                label="Бүтэн нэр"
                rules={[
                  { required: true, message: 'Нэрээ оруулна уу' },
                  { min: 2, message: 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Таны бүтэн нэр" />
              </Form.Item>

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

              <Form.Item name="organization" label="Байгууллага (Заавал биш)">
                <Input prefix={<BankOutlined />} placeholder="Компани эсвэл байгууллагын нэр" />
              </Form.Item>

              <Form.Item name="role" label="Албан тушаал (Заавал биш)">
                <Select placeholder="Албан тушаалаа сонгоно уу">
                  <Option value="manager">Удирдлага</Option>
                  <Option value="legal">Хуулийн зөвлөх</Option>
                  <Option value="hr">Хүний нөөц</Option>
                  <Option value="finance">Санхүү</Option>
                  <Option value="academic">Боловсролын ажилтан</Option>
                  <Option value="student">Оюутан</Option>
                  <Option value="other">Бусад</Option>
                </Select>
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

              <Form.Item
                name="confirmPassword"
                label="Нууц үг давтах"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Нууц үгээ давтан оруулна уу' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Нууц үг таарахгүй байна'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Нууц үгээ дахин оруулна уу" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={success}
                  className="w-full h-10"
                >
                  Бүртгүүлэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <span className="text-sm text-[#64748b]">
                Аль хэдийн бүртгэлтэй юу?{' '}
                <Link href="/auth/signin" className="text-[#1e3a8a]">
                  Нэвтрэх
                </Link>
              </span>
            </div>
          </Card>

          <div className="text-center mt-4">
            <span className="text-xs text-[#64748b]">
              Бүртгүүлэх нь манай{' '}
              <Link href="/terms" className="text-[#1e3a8a]">Үйлчилгээний нөхцөл</Link>
              {' '}болон{' '}
              <Link href="/privacy" className="text-[#1e3a8a]">Нууцлалын бодлого</Link>-г
              хүлээн зөвшөөрч байна гэсэн үг юм.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
