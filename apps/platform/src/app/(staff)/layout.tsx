import { AppProvider } from '@/lib/context';

export default function StaffLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
