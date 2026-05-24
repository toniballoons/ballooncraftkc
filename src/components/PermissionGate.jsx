import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-[2rem] border bg-white p-8 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl">This staff account does not have access to this area</h1>
          <p className="text-muted-foreground leading-7">
            Toni can expand this account’s permissions from the Account & Team area if this person should manage
            messages, site content, client studio tools, or the scheduling calendar.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/admin/account">Open my account</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Go back to admin home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PermissionGate({ permission = 'account', fallback = <AccessDenied />, children }) {
  const { isLoadingAuth, hasPermission } = useAuth();

  if (isLoadingAuth) {
    return <LoadingFallback />;
  }

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
