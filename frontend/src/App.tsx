import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { 
  SignIn, 
  NotFound, 
  ServerError,
  UserProfiles, 
  Home,
  AdminTable,
  LockedAdminsTable,
  FacultiesTable,
  DepartmentsTable,
  StudentsTable,
  ElectionsTable,
  ElectionDetail,
  CandidatesTable,
  ResultsTable,
  UserDetail,
  FacultyDetail,
  DepartmentDetail
} from "./pages";
import AdminForm from "./components/features/AdminForm";
import FacultyForm from "./components/features/FacultyForm";
import DepartmentForm from "./components/features/DepartmentForm";
import ElectionForm from "./components/features/ElectionForm";
import { AppLayout } from "./components/layout";
import ScrollToTop from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ModalProvider } from "./context/ModalContext";
import { SocketIOProvider } from "./context/SocketIOContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROUTES, USER_ROLES } from "./utils/constants";

const Spinner = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    }}
  >
    <div
      className="loader"
      style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #465FFF",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Spinner />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function AppRoutes() {
  const { loading } = useAuth();
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <Routes>
      
      <Route
        path={ROUTES.SIGNIN}
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.HOME}
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index path={ROUTES.DASHBOARD} element={<Home />} />
        <Route path={ROUTES.PROFILE} element={<UserProfiles />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route
          path={ROUTES.ADMINS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <AdminTable />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LOCKED_ADMINS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <LockedAdminsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins/new"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <AdminForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins/:id"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admins/:id/edit"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <AdminForm mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.FACULTIES}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <FacultiesTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculties/new"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <FacultyForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculties/:id"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <FacultyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculties/:id/edit"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
              <FacultyForm mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DEPARTMENTS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <DepartmentsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/:id"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <DepartmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/:id/edit"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <DepartmentForm mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STUDENTS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <StudentsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <UserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ELECTIONS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <ElectionsTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elections/new"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <ElectionForm mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elections/:id/edit"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <ElectionForm mode="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elections/:id"
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <ElectionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CANDIDATES}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <CandidatesTable />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.RESULTS}
          element={
            <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
              <ResultsTable />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path={ROUTES.SERVER_ERROR} element={<ServerError />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketIOProvider>
        <SidebarProvider>
          <ModalProvider>
            <Router>
              <ScrollToTop />
              <AppRoutes />
              <Toaster position="top-right" containerClassName="z-[100000] mt-20" />
            </Router>
          </ModalProvider>
        </SidebarProvider>
      </SocketIOProvider>
    </AuthProvider>
  );
}
