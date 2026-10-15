import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · administration" },
  robots: { index: false, follow: false },
};

export default function LayoutAdminRacine({ children }: LayoutProps<"/admin">) {
  return children;
}
