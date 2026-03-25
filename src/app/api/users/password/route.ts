import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userOperations } from '@/lib/database'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// PUT /api/users/password — change password for the authenticated user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Одоогийн болон шинэ нууц үг шаардлагатай' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Шинэ нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой' }, { status: 400 })
    }

    // Get user with password
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) {
      return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 })
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Одоогийн нууц үг буруу байна' }, { status: 400 })
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Нууц үг солиход алдаа гарлаа' }, { status: 500 })
  }
}
