'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ensureDemoUser } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Demo kullanıcıyı oluştur (varsa atlar)
    ensureDemoUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@taskflow.com');
    setPassword('demo123');
  };

  if (loading) return null;

  return (
    <div className={styles.authPage}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.loginWrapper}>
        <div className={styles.card}>
          <div className={styles.brandSection}>
            <div className={styles.logo}>T</div>
            <h1 className={styles.heading}>Tekrar Hoş Geldin</h1>
            <p className={styles.subheading}>Hesabına giriş yap ve projelerini yönet</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}

            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Giriş Yap
            </Button>
          </form>

          <div className={styles.divider}>veya</div>

          <p className={styles.switchLink}>
            Hesabın yok mu? <Link href="/register">Kayıt Ol</Link>
          </p>
        </div>

        <div className={styles.demoCard}>
          <div className={styles.demoHeader}>
            <span className={styles.demoIcon}>🔑</span>
            <h3 className={styles.demoTitle}>Test Giriş Bilgileri</h3>
          </div>
          <p className={styles.demoDesc}>
            Uygulamayı hızlıca test etmek için aşağıdaki bilgileri kullanabilirsiniz:
          </p>
          <div className={styles.demoCredentials}>
            <div className={styles.demoField}>
              <span className={styles.demoLabel}>E-posta</span>
              <span className={styles.demoValue}>demo@taskflow.com</span>
            </div>
            <div className={styles.demoField}>
              <span className={styles.demoLabel}>Şifre</span>
              <span className={styles.demoValue}>demo123</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" fullWidth onClick={fillDemoCredentials}>
            Bilgileri Otomatik Doldur
          </Button>
        </div>
      </div>
    </div>
  );
}
