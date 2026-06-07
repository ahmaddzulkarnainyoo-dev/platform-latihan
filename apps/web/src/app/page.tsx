import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: exams } = await supabase
    .from('exams')
    .select('*, categories(name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>🎯 Platform Latihan</h1>
        <a href="/login" style={{ padding: '8px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          Admin Login
        </a>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Pilih Ujian</h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Latihan soal untuk persiapan ujian kamu</p>

        {!exams || exams.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px' }}>📝</p>
            <p style={{ color: '#64748b' }}>Belum ada ujian yang tersedia.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {exams.map((exam: any) => (
              <a key={exam.id} href={`/tryout/${exam.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>
                    {exam.categories?.name}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '12px 0 8px' }}>{exam.title}</h3>
                  {exam.description && <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>{exam.description}</p>}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                    <span>⏱️ {exam.duration_minutes} menit</span>
                    <span>🎯 Lulus {exam.passing_score}%</span>
                  </div>
                  <div style={{ marginTop: '16px', padding: '10px', background: '#2563eb', borderRadius: '8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>
                    Mulai Latihan →
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}