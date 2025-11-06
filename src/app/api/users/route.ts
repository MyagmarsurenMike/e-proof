import { NextRequest, NextResponse } from 'next/server'
import { userOperations, statisticsOperations, auditOperations } from '@/lib/database'
import bcrypt from 'bcryptjs'

// GET /api/users - Get user profile and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Хэрэглэгчийн ID эсвэл имэйл шаардлагатай' },
        { status: 400 }
      )
    }

    let user
    if (userId) {
      user = await userOperations.getUserById(userId)
    } else if (email) {
      user = await userOperations.getUserByEmail(email)
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Хэрэглэгч олдсонгүй' },
        { status: 404 }
      )
    }

    // Get user statistics
    const stats = await statisticsOperations.getUserStats(user.id)

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      stats,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Хэрэглэгчийн мэдээллийг татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      password,
      walletAddress,
      organization,
      role,
    } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Имэйл хаяг шаардлагатай' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await userOperations.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Энэ имэйл хаягаар бүртгэгдсэн хэрэглэгч байна' },
        { status: 409 }
      )
    }

    // Hash password if provided
    let hashedPassword = undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    // Create user
    const user = await userOperations.createUser({
      email,
      name,
      password: hashedPassword,
      walletAddress,
      organization,
      role,
    })

    // Log the action
    await auditOperations.createAuditLog({
      userId: user.id,
      action: 'USER_CREATED',
      resource: 'user',
      resourceId: user.id,
      details: {
        email,
        name,
        organization,
        role,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Remove sensitive information
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Хэрэглэгч үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      avatar,
      organization,
      role,
      phone,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Хэрэглэгчийн ID шаардлагатай' },
        { status: 400 }
      )
    }

    // Update user
    const user = await userOperations.updateUser(userId, {
      name,
      avatar,
      organization,
      role,
      phone,
    })

    // Log the action
    await auditOperations.createAuditLog({
      userId,
      action: 'USER_UPDATED',
      resource: 'user',
      resourceId: userId,
      details: {
        name,
        organization,
        role,
        phone,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Хэрэглэгчийн мэдээллийг шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}