import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import PageEditor from '@/pages/admin/PageEditor';

export default function AdminHome() {
  const location = useLocation();
  const { hasPermission, adminHomePath } = useAuth();
  const params = new URLSearchParams(location.search);
  const requestedPanel = params.get('panel');

  if (requestedPanel === 'clients' && hasPermission('clients')) {
    return <PageEditor />;
  }

  if (hasPermission('site')) {
    return <PageEditor />;
  }

  if (hasPermission('clients')) {
    return <Navigate to="/admin?panel=clients" replace />;
  }

  return <Navigate to={adminHomePath} replace />;
}
