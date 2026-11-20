import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote",
  description: "Cast your vote for this week's Movie Monday",
};

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return <section className="w-full py-4">{children}</section>;
}