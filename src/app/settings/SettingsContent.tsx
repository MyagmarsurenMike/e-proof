'use client';

import React, { useState } from 'react';
import { Button, App } from 'antd';
import { LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import Input from 'antd/es/input';
import { AppShell } from '@/components/layout/AppShell';

export default function SettingsContent() {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      message.warning('Бүх талбарыг бөглөнө үү');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      message.error('Шинэ нууц үг таарахгүй байна');
      return;
    }
    if (form.newPassword.length < 8) {
      message.error('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success('Нууц үг амжилттай солигдлоо');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Нууц үг солиход алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-6 max-w-lg mx-auto w-full">
        <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Тохиргоо</h2>

        {/* Password change */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px' }}>
          <p className="font-semibold text-[#0f172a] mb-1">Нууц үг солих</p>
          <p className="text-xs text-[#64748b] mb-5">Аюулгүй байдлын үүднээс нууц үгээ тогтмол сольж байна уу.</p>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-[#64748b] mb-1">Одоогийн нууц үг</p>
              <Input
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                suffix={
                  <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                }
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Одоогийн нууц үг"
              />
            </div>

            <div>
              <p className="text-xs text-[#64748b] mb-1">Шинэ нууц үг</p>
              <Input
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                suffix={
                  <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                }
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Хамгийн багадаа 8 тэмдэгт"
              />
            </div>

            <div>
              <p className="text-xs text-[#64748b] mb-1">Шинэ нууц үг давтах</p>
              <Input
                prefix={<LockOutlined style={{ color: '#64748b' }} />}
                suffix={
                  <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </span>
                }
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Нууц үг давтан оруулна уу"
              />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <Button type="primary" loading={saving} onClick={handleChangePassword}>
                Нууц үг солих
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
