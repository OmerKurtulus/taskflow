import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'TaskFlow — Kanban Proje Yönetim Tahtası',
  description:
    'Trello benzeri sürükle-bırak destekli kanban proje yönetim uygulaması. Board oluşturun, görevlerinizi sütunlar arasında yönetin.',
  keywords: 'kanban, proje yönetimi, görev takibi, task management, trello alternative',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
