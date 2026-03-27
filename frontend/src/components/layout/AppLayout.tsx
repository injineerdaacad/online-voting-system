import React from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import AppFooter from "./AppFooter";
import { useSidebar } from "../../context/SidebarContext";
import { useModal } from "../../context/ModalContext";

const AppLayout: React.FC = () => {
  const { isOpen } = useSidebar();
  const { isModalOpen } = useModal();

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-slate-50 via-university-gold-50/20 to-university-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
        
        {!isModalOpen && <AppSidebar />}

        <div
          className={`flex-1 flex flex-col transition-all duration-300 w-full max-w-[100vw] overflow-x-hidden ${
            isModalOpen ? "ml-0" : isOpen ? "lg:ml-64 ml-0" : "lg:ml-20 ml-0 sm:ml-16"
          }`}
        >
          
          {!isModalOpen && <AppHeader />}

          <main className={`flex-1 overflow-x-hidden ${isModalOpen ? "pt-0" : "pt-16 sm:pt-20"}`}>
            <div className="w-full overflow-x-auto p-3 sm:p-4 lg:p-6 pb-0 mb-0 !mb-0">
              <Outlet />
            </div>
          </main>

          {!isModalOpen && <AppFooter />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;