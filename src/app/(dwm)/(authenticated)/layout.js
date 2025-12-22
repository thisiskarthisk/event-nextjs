import AuthenticatedPage from "@/components/auth/authPageWrapper";

export default function DWMThemeLayout({ children }) {
  return (<AuthenticatedPage>{children}</AuthenticatedPage>);
}
