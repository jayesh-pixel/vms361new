"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { IAMService } from '@/lib/iam/service';
import type { User, CompanyRole } from '@/lib/types/iam';
import type { Action, Resource } from '@/lib/types/iam';

export interface PermissionHookType {
  userPermissions: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Permission checking functions
  hasPermission: (action: Action, resource: Resource) => boolean;
  canCreateShip: () => boolean;
  canUpdateShip: () => boolean;
  canDeleteShip: () => boolean;
  canManageCrew: () => boolean;
  canManageInventory: () => boolean;
  canCreateRequisition: () => boolean;
  canApproveRequisition: () => boolean;
  canManageVendors: () => boolean;
  canCreateTask: () => boolean;
  canManageUsers: () => boolean;
  canViewReports: () => boolean;
  canManageCompanySettings: () => boolean;
  
  // Role checking
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isProcurement: () => boolean;
  isFinance: () => boolean;
  isViewer: () => boolean;
}

export function usePermissions(): PermissionHookType {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions when user changes
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user?.uid) {
        setUserPermissions(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const userData = await IAMFirestoreService.getUserByUID(user.uid);
        console.log('Loaded user permissions:', userData);
        setUserPermissions(userData);
      } catch (err: any) {
        console.error('Error loading user permissions:', err);
        setError(err.message);
        setUserPermissions(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPermissions();
  }, [user]);

  // Generic permission checking
  const hasPermission = (action: Action, resource: Resource): boolean => {
    if (!userPermissions) return false;
    try {
      return IAMService.hasPermission(userPermissions, action, resource).allowed;
    } catch {
      return false;
    }
  };

  // Ship permissions
  const canCreateShip = (): boolean => hasPermission('create', 'ship_profile');
  const canUpdateShip = (): boolean => hasPermission('update', 'ship_profile');
  const canDeleteShip = (): boolean => hasPermission('delete', 'ship_profile');

  // Crew permissions
  const canManageCrew = (): boolean => hasPermission('create', 'crew_hr') || hasPermission('update', 'crew_hr');

  // Inventory permissions
  const canManageInventory = (): boolean => hasPermission('create', 'inventory') || hasPermission('update', 'inventory');

  // Requisition permissions
  const canCreateRequisition = (): boolean => hasPermission('create', 'requisition');
  const canApproveRequisition = (): boolean => hasPermission('approve', 'requisition');
  
  // Vendor permissions
  const canManageVendors = (): boolean => hasPermission('create', 'vendor') || hasPermission('update', 'vendor') || isProcurement() || isAdmin() || isOwner();

  // Task permissions
  const canCreateTask = (): boolean => hasPermission('create', 'task');

  // Admin permissions
  const canManageUsers = (): boolean => hasPermission('invite', 'company_settings') || hasPermission('manage_roles', 'company_settings');
  const canViewReports = (): boolean => hasPermission('export', 'company_settings');
  const canManageCompanySettings = (): boolean => hasPermission('update', 'company_settings');

  // Role checking functions
  const isOwner = (): boolean => userPermissions?.companyRole === 'owner';
  const isAdmin = (): boolean => userPermissions?.companyRole === 'admin';
  const isHR = (): boolean => userPermissions?.companyRole === 'hr';
  const isProcurement = (): boolean => userPermissions?.companyRole === 'procurement';
  const isFinance = (): boolean => userPermissions?.companyRole === 'finance';
  const isViewer = (): boolean => userPermissions?.companyRole === 'viewer';

  return {
    userPermissions,
    isLoading,
    error,
    hasPermission,
    canCreateShip,
    canUpdateShip,
    canDeleteShip,
    canManageCrew,
    canManageInventory,
    canCreateRequisition,
    canApproveRequisition,
    canManageVendors,
    canCreateTask,
    canManageUsers,
    canViewReports,
    canManageCompanySettings,
    isOwner,
    isAdmin,
    isHR,
    isProcurement,
    isFinance,
    isViewer,
  };
}
