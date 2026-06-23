export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 pt-3 pb-8">
      <div className="inline-block w-full text-center justify-center">
        {children}
      </div>
    </section>
  );
}
 