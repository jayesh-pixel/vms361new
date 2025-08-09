// IAM Types for Ship Management System

export type CompanyRole =
  | 'owner'
  | 'admin'
  | 'hr'
  | 'procurement'
  | 'finance'
  | 'viewer';

export type ShipRole =
  | 'master'
  | 'chief_engineer'
  | 'chief_officer'
  | 'officer_2'
  | 'officer_3'
  | 'bosun'
  | 'ship_procurement'
  | 'ship_crew_manager'
  | 'viewer_ship';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'receive'
  | 'post'          // e.g. post invoice payment
  | 'export'
  | 'invite'
  | 'manage_roles';

export type Resource =
  | 'company_settings'
  | 'ship_profile'
  | 'ship_documents'
  | 'crew_hr'
  | 'crew_assignments'
  | 'inventory'
  | 'inventory_txn'
  | 'requisition'
  | 'purchase_order'
  | 'invoice'
  | 'vendor'
  | 'task'
  | 'shift'
  | 'log'
  | 'job'
  | 'application'
  | 'stats';

// Core IAM interfaces
export interface Company {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
  settings: CompanySettings
  createdAt: Date
  updatedAt: Date
}

export interface CompanySettings {
  timezone: string
  currency: string
  dateFormat: string
  enableNotifications: boolean
  autoApprovalLimits: {
    requisition: number
    purchaseOrder: number
  }
}

export interface User {
  id: string
  uid: string // Firebase UID
  email: string
  displayName: string
  photoURL?: string
  phone?: string
  companyId: string
  companyRole: CompanyRole
  shipRoles: ShipRoleAssignment[] // Roles on specific ships
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string // UID of user who created this user
}

export interface ShipRoleAssignment {
  shipId: string
  shipName: string
  role: ShipRole
  assignedAt: Date
  assignedBy: string // UID of user who assigned this role
}

export interface UserInvite {
  id: string
  email: string
  companyId: string
  companyRole: CompanyRole
  shipRoles: Omit<ShipRoleAssignment, 'assignedAt' | 'assignedBy'>[]
  invitedBy: string // UID
  inviteToken: string
  expiresAt: Date
  status: 'pending' | 'accepted' | 'expired'
  createdAt: Date
}

// Permission check result
export interface PermissionResult {
  allowed: boolean
  reason?: string
  scope?: 'company' | 'ship'
  shipId?: string
}
