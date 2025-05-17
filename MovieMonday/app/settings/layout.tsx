export default function MovieMondayLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="w-full max-w-7xl">
          {children}
        </div>
      </section>
    );
  }