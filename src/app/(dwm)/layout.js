'use client';

import AppLayout from "@/components/appLayout";
import { usePathname } from "next/navigation";

export default function DWMLayout({ children }) {
  const pathname = usePathname();

  return (<AppLayout key={pathname}>{children}</AppLayout>);
}
