'use client';

import React from 'react';
import { Button, Card, Row, Col, Typography, Space, Statistic, Timeline, Alert } from 'antd';
import { 
  SafetyCertificateOutlined, 
  SecurityScanOutlined, 
  CloudUploadOutlined,
  CheckCircleOutlined,
  LockOutlined,
  GlobalOutlined,
  FileTextOutlined,
  UserOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  StarFilled
} from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const features = [
    {
      icon: <SecurityScanOutlined className="text-4xl text-blue-600" />,
      title: "Блокчэйн аюулгүй байдал",
      description: "Таны баримт бичгүүд хувиршгүй блокчэйн технологиор хамгаалагдаж, байнгын баталгаажуулалт болон хуурамч байдлаас сэргийлсэн бичлэгийг хангана."
    },
    {
      icon: <LockOutlined className="text-4xl text-green-600" />,
      title: "Нууцлал хамгаалагдсан",
      description: "Зөвхөн баримт бичгийн хурууны хээ блокчэйнд хадгалагдана. Таны эх баримт бичиг бүрэн нууцлагдаж, аюулгүй байна."
    },
    {
      icon: <GlobalOutlined className="text-4xl text-purple-600" />,
      title: "Дэлхий даяарх хандалт",
      description: "Дэлхийн хаанаас ч таны баталгаажсан баримт бичигт хандаарай. Итгэмжлэгдсэн талуудтай баталгаажуулалтын холбоосыг шуурхай хуваалцаарай."
    },
    {
      icon: <CheckCircleOutlined className="text-4xl text-orange-600" />,
      title: "Шуурхай баталгаажуулалт",
      description: "Бодит цагт баталгаажуулалтын статус болон блокчэйн гэрчилгээ авах. Хүлээлгийн хугацаа эсвэл гараар зөвшөөрөх үйл явц байхгүй."
    }
  ];

  const steps = [
    {
      title: "Баримт бичиг оруулах",
      description: "Гэрээ, гэрчилгээ эсвэл чухал баримт бичгээ манай платформд аюулгүйгээр сонгож оруулна уу."
    },
    {
      title: "Хэш үүсгэх",
      description: "Манай систем эх баримт бичгийг хадгалахгүйгээр таны баримт бичгийн өвөрмөц криптограф хурууны хээг үүсгэнэ."
    },
    {
      title: "Блокчэйн хадгалалт",
      description: "Баримт бичгийн хэш блокчэйнд байнга бүртгэгдэж, жинхэнэ байдлын өөрчлөгдөшгүй нотолгоог бүрдүүлнэ."
    },
    {
      title: "Гэрчилгээ авах",
      description: "Хэн ч хуваалцаж, баталгаажуулах боломжтой блокчэйн баталгаажуулалтын гэрчилгээгээ хүлээн авна уу."
    }
  ];

  const testimonials = [
    {
      name: "Сарангэрэл Баярмаа",
      role: "Хуулийн зөвлөх",
      comment: "E-Proof нь бидний гэрээ баталгаажуулах арга барилыг бүрэн өөрчилсөн. Блокчэйн аюулгүй байдал нь манай үйлчлүүлэгчдэд бүрэн итгэл өгдөг.",
      rating: 5
    },
    {
      name: "Мөнхбаяр Цэрэн",
      role: "Хүний нөөцийн захирал",
      comment: "Ажилчдын гэрчилгээ баталгаажуулах нь хэзээ ч ийм хялбар байгаагүй. Шуурхай баталгаажуулалт нь бидэнд олон цагийн гараар хийх ажлыг хэмнэж өгдөг.",
      rating: 5
    },
    {
      name: "Доктор Оюунчимэг Батбаяр",
      role: "Их сургуулийн бүртгэлийн ажилтан",
      comment: "Диплом баталгаажуулалтын төгс шийдэл. Блокчэйний байнгын бичлэг нь хуурамч байдлын бүх боломжийг арилгана.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="bg-blue-600 p-4 rounded-full">
                  <SafetyCertificateOutlined className="text-4xl text-white" />
                </div>
              </div>
              <Title level={1} className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-blue-600">Блокчэйн</span> дээр аюулгүй баримт бичиг баталгаажуулалт
              </Title>
              <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Гэрээ, гэрчилгээ болон чухал баримт бичгүүдээ өөрчлөгдөшгүй блокчэйн технологиор хамгаалаарай. 
                Мөнхөд үргэлжлэх хуурамч байдлаас сэргийлсэн баталгаажуулалт үүсгээрэй.
              </Paragraph>
              <Space size="large" className="flex-wrap justify-center">
                <Link href="/verify">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<CloudUploadOutlined />}
                    className="h-14 px-8 text-lg font-semibold"
                  >
                    Баримт бичгээ баталгаажуулах
                  </Button>
                </Link>
                <Button 
                  size="large" 
                  icon={<PlayCircleOutlined />}
                  className="h-14 px-8 text-lg font-semibold"
                >
                  Жишээ үзэх
                </Button>
              </Space>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Row gutter={[32, 32]} className="text-center">
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Баталгаажсан баримт бичиг" 
                  value={15420} 
                  valueStyle={{ color: '#1e3a8a', fontSize: '2.5rem', fontWeight: 'bold' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Блокчэйн бичлэг" 
                  value={8350} 
                  valueStyle={{ color: '#1e3a8a', fontSize: '2.5rem', fontWeight: 'bold' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Итгэмжлэгдсэн байгууллага" 
                  value={250} 
                  suffix="+"
                  valueStyle={{ color: '#1e3a8a', fontSize: '2.5rem', fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Title level={2} className="text-4xl font-bold text-gray-900 mb-4">
                Яагаад E-Proof-г сонгох вэ?
              </Title>
              <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto">
                Хамгийн найдвартай, аюулгүй баримт бичиг баталгаажуулалтын платформыг хангахын тулд хамгийн сүүлийн үеийн блокчэйн технологиор бүтээгдсэн.
              </Paragraph>
            </div>
            
            <Row gutter={[32, 32]}>
              {features.map((feature, index) => (
                <Col xs={24} md={12} lg={6} key={index}>
                  <Card 
                    className="h-full text-center hover:shadow-lg transition-all duration-300 border-0"
                    styles={{ body: { padding: '2rem' } }}
                  >
                    <div className="mb-4">{feature.icon}</div>
                    <Title level={4} className="mb-3">{feature.title}</Title>
                    <Paragraph className="text-gray-600">
                      {feature.description}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Title level={2} className="text-4xl font-bold text-gray-900 mb-4">
                Хэрхэн ажилладаг
              </Title>
              <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto">
                Энгийн, аюулгүй, тунгалаг. Ердөө дөрвөн хялбар алхамаар таны баримт бичгийг блокчэйнд баталгаажуулна уу.
              </Paragraph>
            </div>
            
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} lg={12}>
                <Timeline
                  items={steps.map((step, index) => ({
                    dot: (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    ),
                    children: (
                      <div className="pb-8">
                        <Title level={4} className="mb-2">{step.title}</Title>
                        <Paragraph className="text-gray-600 text-lg">
                          {step.description}
                        </Paragraph>
                      </div>
                    )
                  }))}
                />
              </Col>
              <Col xs={24} lg={12}>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                  <div className="text-center">
                    <FileTextOutlined className="text-6xl text-blue-600 mb-4" />
                    <Title level={3} className="mb-4">Эхлэхэд бэлэн үү?</Title>
                    <Paragraph className="text-gray-600 mb-6">
                      Баримт бичиг баталгаажуулалтын хэрэгцээндээ E-Proof-д итгэдэг олон мянган хэрэглэгчдэд нэгдээрэй.
                    </Paragraph>
                    <Link href="/verify">
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<ArrowRightOutlined />}
                        className="h-12 px-8"
                      >
                        Баталгаажуулалт эхлүүлэх
                      </Button>
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Title level={2} className="text-4xl font-bold text-gray-900 mb-4">
                Мэргэжилтнүүдийн итгэх
              </Title>
              <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto">
                Манай хэрэглэгчид E-Proof-тай ажилласан туршлагаа хэрхэн дүгнэж байгааг хараарай.
              </Paragraph>
            </div>
            
            <Row gutter={[32, 32]}>
              {testimonials.map((testimonial, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card className="h-full">
                    <div className="mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarFilled key={i} className="text-yellow-500 mr-1" />
                      ))}
                    </div>
                    <Paragraph className="text-gray-600 mb-4 italic">
                      "{testimonial.comment}"
                    </Paragraph>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <UserOutlined className="text-gray-600" />
                      </div>
                      <div>
                        <Text strong>{testimonial.name}</Text>
                        <div className="text-gray-500 text-sm">{testimonial.role}</div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Title level={2} className="text-4xl font-bold text-white mb-4">
              Өнөөдөр баримт бичгээ хамгаалж эхлээрэй
            </Title>
            <Paragraph className="text-xl text-blue-100 mb-8">
              Блокчэйн хувьсгалд нэгдэж, чухал баримт бичгүүдээ байнгын, хуурамч байдлаас сэргийлсэн баталгаажуулалтаар хамгаалаарай.
            </Paragraph>
            <Space size="large">
              <Link href="/verify">
                <Button 
                  type="default" 
                  size="large" 
                  icon={<CloudUploadOutlined />}
                  className="h-14 px-8 text-lg font-semibold"
                >
                  Баримт бичиг баталгаажуулах
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button 
                  size="large" 
                  className="h-14 px-8 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Бүртгэл үүсгэх
                </Button>
              </Link>
            </Space>
          </div>
        </section>

        {/* Security Notice */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert
              message="Таны аюулгүй байдал бол манай тэргүүлэх зорилго"
              description="E-Proof нь таны баримт бичгүүд аюулгүй, нууцлагдсан байхыг хангахын тулд байгууллагын түвшний шифрлэлт болон блокчэйн технологи ашигладаг. Бид хэзээ ч таны эх баримт бичгийг хадгалдаггүй - зөвхөн криптограф хэшүүд блокчэйнд бүртгэгддэг."
              type="info"
              showIcon
              icon={<SecurityScanOutlined />}
            />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
