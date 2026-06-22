import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Pulls the person's name for a nicer browser tab / share title.
// Falls back gracefully if TMDB is unreachable so the page never blocks on it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
      { next: { revalidate: 86400 } },
    );

    if (res.ok) {
      const person = await res.json();
      if (person?.name) {
        return {
          title: person.name,
          description: `Movies featuring ${person.name}, including the ones your group has watched on Movie Monday.`,
        };
      }
    }
  } catch {
    // Ignore and fall through to the default title
  }

  return { title: "Actor" };
}

export default function ActorLayout({ children }: LayoutProps) {
  return <section>{children}</section>;
}