import UnAuthenticatedPage from "@/components/auth/unAuthPagewrapper";

export default function DWMThemeLayout({ children }) {
  return (<UnAuthenticatedPage>{children}</UnAuthenticatedPage>);
}
