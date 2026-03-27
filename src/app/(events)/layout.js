'use client';

import AppLayout from "@/components/appLayout";
import { usePathname } from "next/navigation";

export default function EventsLayout({ children }) {
  const pathname = usePathname();

  return (<AppLayout key={pathname}>{children}</AppLayout>);
}
