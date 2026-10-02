import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from '../pages/AnalyticsPage/AnalyticsPage';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { TasksPage } from '../pages/TasksPage/TasksPage';
import { HOME_PATH, PATHS } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path={PATHS.login} element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={PATHS.analytics} element={<AnalyticsPage />} />
          <Route path={PATHS.tasks} element={<TasksPage />} />
        </Route>
        <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
