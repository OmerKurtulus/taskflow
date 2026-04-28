'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  const features = [
    {
      icon: '📋',
      title: 'Board Yönetimi',
      desc: 'Projeleriniz için sınırsız board oluşturun ve görevlerinizi organize edin.',
    },
    {
      icon: '🔄',
      title: 'Sürükle & Bırak',
      desc: 'Kartları ve sütunları sürükleyerek anında durumlarını güncelleyin.',
    },
    {
      icon: '🏷️',
      title: 'Etiketler & Tarihler',
      desc: 'Renkli etiketler ve son teslim tarihleri ile öncelikleri belirleyin.',
    },
    {
      icon: '📱',
      title: 'Mobil Uyumlu',
      desc: 'Her cihazda mükemmel çalışan responsive tasarım.',
    },
    {
      icon: '📊',
      title: 'Aktivite Geçmişi',
      desc: 'Kartların hangi sütunlar arasında taşındığını takip edin.',
    },
    {
      icon: '💾',
      title: 'Otomatik Kayıt',
      desc: 'Tüm değişiklikler anında kaydedilir, sayfa yenilense bile kaybolmaz.',
    },
  ];

  return (
    <div className={styles.landing}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.orb + ' ' + styles.orb1} />
        <div className={styles.orb + ' ' + styles.orb2} />
        <div className={styles.orb + ' ' + styles.orb3} />

        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Kanban Proje Yönetimi
          </div>

          <h1 className={styles.title}>
            Projelerini{' '}
            <span className={styles.titleGradient}>TaskFlow</span>
            {' '}ile Yönet
          </h1>

          <p className={styles.subtitle}>
            Sürükle-bırak destekli modern kanban tahtası ile görevlerinizi kolayca organize edin,
            takip edin ve tamamlayın.
          </p>

          <div className={styles.cta}>
            <Link href="/register">
              <Button size="lg">Hemen Başla →</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Özellikler</h2>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2025 TaskFlow. Tüm hakları saklıdır.</p>
        <p>
          Powered by{' '}
          <a
            href="https://linkedin.com/in/ömer-faruk-kurtuluş-5b0465204"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Ömer Kurtuluş
          </a>
        </p>
      </footer>
    </div>
  );
}
