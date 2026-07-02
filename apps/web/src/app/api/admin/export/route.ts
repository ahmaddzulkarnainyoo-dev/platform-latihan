import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateCSV(rows: string[][]): string {
  return rows.map(row => row.map(escapeCSV).join(',')).join('\r\n')
}

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
            // Read-only operation
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
    const type = searchParams.get('type') || 'users'

    let csvContent = ''
    let filename = ''

    if (type === 'users' || type === 'all') {
      // Ambil data users dari profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      // Ambil data auth users jika service role key tersedia
      let authUsers: any[] = []
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
              auth: { autoRefreshToken: false, persistSession: false },
              cookies: { getAll() { return [] }, setAll() {} },
            }
          )
          const { data: usersData } = await adminClient.auth.admin.listUsers()
          if (usersData?.users) authUsers = usersData.users
        } catch (e) {
          console.log('Admin API not available')
        }
      }

      // Hitung total tryout per user
      const { data: attemptCounts } = await supabase
        .from('exam_attempts')
        .select('user_id, score')
        .eq('status', 'completed')

      const userAttemptMap: Record<string, { count: number; totalScore: number }> = {}
      if (attemptCounts) {
        for (const a of attemptCounts) {
          if (!userAttemptMap[a.user_id]) {
            userAttemptMap[a.user_id] = { count: 0, totalScore: 0 }
          }
          userAttemptMap[a.user_id].count++
          userAttemptMap[a.user_id].totalScore += a.score || 0
        }
      }

      const userRows: string[][] = [
        ['ID', 'Nama', 'Email', 'Role', 'Tanggal Bergabung', 'Total Tryout', 'Rata-rata Skor'],
      ]

      for (const profile of profiles || []) {
        const authUser = authUsers.find((u: any) => u.id === profile.id)
        const email = authUser?.email || profile.email || ''
        const attempts = userAttemptMap[profile.id]
        const totalTryout = attempts?.count || 0
        const avgScore = attempts && attempts.count > 0
          ? Math.round(attempts.totalScore / attempts.count)
          : 0

        userRows.push([
          profile.id,
          profile.full_name || '',
          email,
          profile.role || 'user',
          new Date(profile.created_at).toISOString().split('T')[0],
          String(totalTryout),
          `${avgScore}%`,
        ])
      }

      if (type === 'users') {
        csvContent = generateCSV(userRows)
        filename = 'data-pengguna.csv'
      }
    }

    if (type === 'attempts' || type === 'all') {
      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams ( title ),
          profiles ( full_name )
        `)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false })

      if (attemptsError) {
        return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
      }

      const attemptRows: string[][] = [
        ['ID', 'User', 'Ujian', 'Skor', 'Benar', 'Salah', 'Total Soal', 'Waktu (menit)', 'Status Lulus', 'Tanggal'],
      ]

      for (const a of attempts || []) {
        const totalAnswered = a.total_answered || 0
        const correctCount = a.correct_count || 0
        const wrongCount = totalAnswered - correctCount
        const durationMinutes = a.duration_seconds
          ? Math.round(a.duration_seconds / 60)
          : 0
        const passed = a.score >= (a.passing_grade || 70)

        attemptRows.push([
          a.id,
          a.profiles?.full_name || 'Unknown',
          a.exams?.title || 'Unknown',
          String(a.score || 0),
          String(correctCount),
          String(wrongCount),
          String(totalAnswered),
          String(durationMinutes),
          passed ? 'Lulus' : 'Tidak Lulus',
          a.finished_at ? new Date(a.finished_at).toISOString().split('T')[0] : '',
        ])
      }

      const attemptsCSV = generateCSV(attemptRows)

      if (type === 'attempts') {
        csvContent = attemptsCSV
        filename = 'data-hasil-tryout.csv'
      } else {
        // type === 'all', gabungkan users dan attempts
        csvContent = '=== DATA PENGGUNA ===\r\n\r\n' + csvContent + '\r\n\r\n=== DATA HASIL TRYOUT ===\r\n\r\n' + attemptsCSV
        filename = 'data-lengkap.csv'
      }
    }

    if (!csvContent) {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}