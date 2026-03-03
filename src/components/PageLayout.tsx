import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const PageLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className={`flex-1 ${!isHome ? "pt-20 md:pt-28" : ""}`}>{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
