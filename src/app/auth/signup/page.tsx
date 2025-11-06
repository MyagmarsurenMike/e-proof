'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Divider, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BankOutlined } from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SignUp() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: any) => {
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

    } catch (error: any) {
      setError(error.message || 'Бүртгэлд алдаа гарлаа');
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
              Бүртгүүлэх
            </Title>
            <Text className="text-gray-600">
              Э-Нотолгоо системд шинэ бүртгэл үүсгээрэй
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
                  { min: 2, message: 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Таны бүтэн нэр"
                />
              </Form.Item>

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
                name="organization"
                label="Байгууллага (Заавал биш)"
              >
                <Input
                  prefix={<BankOutlined />}
                  placeholder="Компани эсвэл байгууллагын нэр"
                />
              </Form.Item>

              <Form.Item
                name="role"
                label="Албан тушаал (Заавал биш)"
              >
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
                  { min: 6, message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Нууц үгээ оруулна уу"
                />
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
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Нууц үгээ дахин оруулна уу"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={success}
                  className="w-full h-12"
                >
                  Бүртгүүлэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <Text className="text-gray-600">
                Аль хэдийн бүртгэлтэй юу?{' '}
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
                  Нэвтрэх
                </Link>
              </Text>
            </div>
          </Card>

          <div className="text-center">
            <Text className="text-gray-500 text-sm">
              Бүртгүүлэх нь манай{' '}
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