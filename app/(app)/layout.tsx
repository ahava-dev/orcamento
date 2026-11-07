import Nav from '@/components/Nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topo">
        <div className="crop" style={{ width: 90, height: 33 }}>
          <img src="/logo-simbolo.png" alt="Ahava" style={{ marginTop: -31 }} />
        </div>
      </header>
      <main className="shell">{children}</main>
      <Nav />
    </>
  );
}