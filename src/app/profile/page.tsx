'use client';

import React, { useEffect, useState } from 'react';
import { Button, Tag, Descriptions, App } from 'antd';
import { UserOutlined, MailOutlined, BankOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/AppShell';
import Input from 'antd/es/input';

interface UserProfile {
  id: string;
  name?: string;
  email: string;
  organization?: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface Stats {
  total: number;
  verified: number;
  pending: number;
  failed: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { message } = App.useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', organization: '', phone: '' });

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users?userId=${session.user.id}`)
        .then(r => r.json())
        .then(data => {
          setProfile(data.user);
          setStats(data.stats);
          setForm({
            name: data.user.name || '',
            organization: data.user.organization || '',
            phone: data.user.phone || '',
          });
        })
        .catch(() => message.error('Профайл татахад алдаа гарлаа'));
    }
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, ...form }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data.user);
      setEditing(false);
      message.success('Профайл шинэчлэгдлээ');
    } catch {
      message.error('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U';

  return (
    <AppShell>
      <div className="px-8 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0f172a]">Профайл</h2>
          {!editing ? (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Засах</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setEditing(false)}>Болих</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                Хадгалах
              </Button>
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px' }} className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#1e3a8a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <p className="font-semibold text-[#0f172a] text-lg">{profile?.name || '—'}</p>
              <p className="text-sm text-[#64748b]">{profile?.email}</p>
              <Tag color="processing" style={{ marginTop: 4 }}>
                {profile?.role === 'ADMIN' ? 'Админ' : 'Хэрэглэгч'}
              </Tag>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Нэр</p>
                <Input
                  prefix={<UserOutlined />}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Нэр оруулна уу"
                />
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Байгууллага</p>
                <Input
                  prefix={<BankOutlined />}
                  value={form.organization}
                  onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="Байгууллагын нэр"
                />
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Утас</p>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Утасны дугаар"
                />
              </div>
            </div>
          ) : (
            <Descriptions column={1} size="small" bordered={false}>
              <Descriptions.Item label={<span className="text-[#64748b]"><MailOutlined /> Имэйл</span>}>
                {profile?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-[#64748b]"><BankOutlined /> Байгууллага</span>}>
                {profile?.organization || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-[#64748b]">Утас</span>}>
                {profile?.phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-[#64748b]">Бүртгэгдсэн</span>}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('mn-MN') : '—'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Нийт', value: stats.total },
              { label: 'Баталгаажсан', value: stats.verified },
              { label: 'Хүлээгдэж байна', value: stats.pending },
              { label: 'Амжилтгүй', value: stats.failed },
            ].map(({ label, value }) => (
              <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
                <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
                <p className="text-xs text-[#64748b] mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
