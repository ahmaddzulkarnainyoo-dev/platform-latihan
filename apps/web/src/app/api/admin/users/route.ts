import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only operation, no need to set cookies
          },
        },
      }
    )

    // Verifikasi session admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil data dari profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Ambil data auth users via admin API (gunakan service role jika tersedia)
    let authUsers: any[] = []
    try {
      // Coba gunakan admin listUsers jika ada service role key
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            cookies: {
              getAll() { return [] },
              setAll() {},
            },
          }
        )
        const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()
        if (!usersError && usersData?.users) {
          authUsers = usersData.users
        }
      }
    } catch (e) {
      console.log('Admin API not available, using profiles only')
    }

    // Gabungkan data
    const users = (profiles || []).map((profile: any) => {
      const authUser = authUsers.find((u: any) => u.id === profile.id)
      return {
        id: profile.id,
        full_name: profile.full_name || '',
        email: authUser?.email || profile.email || '',
        role: profile.role || 'user',
        avatar_url: profile.avatar_url || '',
        is_active: profile.is_active !== false,
        created_at: profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        confirmed_at: authUser?.confirmed_at || null,
      }
    })

    // Jika ada authUsers yang tidak ada di profiles, tambahkan
    if (authUsers.length > 0) {
      for (const authUser of authUsers) {
        if (!profiles?.find((p: any) => p.id === authUser.id)) {
          users.push({
            id: authUser.id,
            full_name: authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
            role: 'user',
            avatar_url: '',
            is_active: authUser.confirmed_at !== null,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at || null,
            confirmed_at: authUser.confirmed_at || null,
          })
        }
      }
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only operation, no need to set cookies
          },
        },
      }
    )

    // Verifikasi session admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, full_name, role } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Update profile
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only operation, no need to set cookies
          },
        },
      }
    )

    // Verifikasi session admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Hapus dari profiles
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting profile:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    // Jika ada service role key, hapus juga dari auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            cookies: {
              getAll() { return [] },
              setAll() {},
            },
          }
        )
        await adminClient.auth.admin.deleteUser(id)
      } catch (e) {
        console.log('Could not delete from auth.users, profile already removed')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}