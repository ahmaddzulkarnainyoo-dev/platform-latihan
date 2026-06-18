'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 48px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226,232,240,0.5)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'all 0.3s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📚</span>
          <span style={{ fontWeight: 700, fontSize: '20px', color: '#1e293b', letterSpacing: '-0.5px' }}>
            Platform Latihan
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              padding: '10px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
            }}
          >
            Masuk
          </Link>
          <Link
            href="/register"
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: '#1e293b',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.color = '#1e293b'
            }}
          >
            Daftar
          </Link>
          <Link
            href="/admin/login"
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#64748b',
              border: 'none',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#667eea')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 60px',
          textAlign: 'center',
          maxWidth: '1100px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Decorative */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(118,75,162,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '40px',
            background: 'linear-gradient(135deg, #eff6ff, #f0f0ff)',
            color: '#4a3f7a',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px',
            border: '1px solid #e8edff',
          }}
        >
          🚀 Persiapan Ujian Terbaik
        </div>

        <h1
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#1e293b',
            margin: '0 0 16px',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            maxWidth: '800px',
          }}
        >
          Latihan Soal Online{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Profesional
          </span>
        </h1>

        <p
          style={{
            fontSize: '20px',
            color: '#64748b',
            maxWidth: '650px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Platform latihan soal interaktif untuk persiapan Try Out, CPNS, POLRI, dan berbagai ujian lainnya. <br />
          Dengan timer otomatis, analisis hasil, dan pembahasan lengkap.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/login"
            style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '16px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 600,
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.4)'
            }}
          >
            🎯 Mulai Sekarang
          </Link>
        </div>

        {/* Statistik */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            marginTop: '56px',
            padding: '28px 56px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            border: '1px solid rgba(255,255,255,0.3)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>50+</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Paket Soal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>1000+</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Soal Latihan</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>500+</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Siswa Aktif</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>98%</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Kepuasan</div>
          </div>
        </div>
      </div>

      {/* Fitur Section */}
      <div
        style={{
          padding: '80px 24px',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: '12px',
              letterSpacing: '-1px',
            }}
          >
            ✨ Fitur Unggulan
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#64748b',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '0 auto 48px',
            }}
          >
            Semua yang kamu butuhkan untuk persiapan ujian yang efektif
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              { icon: '📝', title: 'Bank Soal Lengkap', desc: 'Ribuan soal dari berbagai kategori ujian nasional dan internasional.' },
              { icon: '⏱️', title: 'Timer Otomatis', desc: 'Latihan dengan timer seperti ujian sungguhan untuk melatih manajemen waktu.' },
              { icon: '📊', title: 'Analisis Hasil', desc: 'Lihat skor, waktu pengerjaan, dan pembahasan setiap soal secara detail.' },
              { icon: '📱', title: 'Akses Dimana Saja', desc: 'Web dan mobile, latihan kapanpun dan dimanapun dengan sinkronisasi akun.' },
              { icon: '🎯', title: 'Try Out Simulasi', desc: 'Simulasi ujian dengan passing grade dan rekomendasi belajar.' },
              { icon: '🏆', title: 'Leaderboard', desc: 'Bandingkan hasil dengan peserta lain dan tingkatkan peringkatmu.' },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '32px 24px',
                  borderRadius: '20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.06)'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ fontSize: '44px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #f8fafc, #f0f4ff)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: '48px',
              letterSpacing: '-1px',
            }}
          >
            💬 Apa Kata Pengguna?
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              { name: 'Andi Saputra', role: 'Peserta CPNS 2025', text: 'Platform ini sangat membantu! Soal-soalnya mirip dengan ujian asli dan pembahasan sangat jelas.' },
              { name: 'Rina Wulandari', role: 'Siswa SMA', text: 'Saya suka fitur timernya. Jadi terbiasa mengerjakan soal dengan batas waktu. Recommended!' },
              { name: 'Budi Santoso', role: 'Peserta POLRI', text: 'Materi lengkap dan update. Saya berhasil lolos berkat latihan di sini.' },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'
                }}
              >
                <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.6, margin: '0 0 16px' }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Bottom */}
      <div
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <h2 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-1px' }}>
          Siap Menghadapi Ujian?
        </h2>
        <p style={{ fontSize: '18px', opacity: 0.9, margin: '0 0 32px', maxWidth: '500px', marginInline: 'auto' }}>
          Bergabunglah dengan ribuan peserta lainnya dan raih hasil terbaik.
        </p>
        <Link
          href="/login"
          style={{
            padding: '18px 56px',
            background: 'white',
            color: '#667eea',
            borderRadius: '16px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 600,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            transition: 'all 0.3s',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
          }}
        >
          🚀 Mulai Sekarang
        </Link>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#94a3b8',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        Platform Latihan Soal © 2026. All rights reserved.
      </footer>
    </div>
  )
}