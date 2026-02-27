import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pt-16 md:pt-20">{children}</main>
    <Footer />
  </div>
);

export default PageLayout;
