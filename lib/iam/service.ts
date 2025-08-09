import { User, Action, Resource, PermissionResult, CompanyRole, ShipRole } from '@/lib/types/iam';
import { COMPANY_POLICY, SHIP_POLICY } from './permissions';

export class IAMService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  static hasPermission(
    user: User,
    action: Action,
    resource: Resource,
    shipId?: string
  ): PermissionResult {
    // Check company-level permissions first (these override ship permissions)
    const companyPermissions = COMPANY_POLICY[user.companyRole];
    const companyResourceActions = companyPermissions?.[resource];
    
    if (companyResourceActions?.includes(action)) {
      return {
        allowed: true,
        scope: 'company'
      };
    }

    // If no company permission, check ship-specific permissions
    if (shipId) {
      const shipRole = user.shipRoles.find(role => role.shipId === shipId);
      if (shipRole) {
        const shipPermissions = SHIP_POLICY[shipRole.role];
        const shipResourceActions = shipPermissions?.[resource];
        
        if (shipResourceActions?.includes(action)) {
          return {
            allowed: true,
            scope: 'ship',
            shipId
          };
        }
      }
    }

    return {
      allowed: false,
      reason: `User does not have ${action} permission on ${resource}${shipId ? ` for ship ${shipId}` : ''}`
    };
  }

  /**
   * Check if user can manage roles (invite users, assign roles)
   */
  static canManageRoles(user: User): boolean {
    return user.companyRole === 'owner' || user.companyRole === 'admin';
  }

  /**
   * Check if user can assign specific company role
   */
  static canAssignCompanyRole(user: User, targetRole: CompanyRole): boolean {
    if (user.companyRole === 'owner') {
      return true; // Owner can assign any role
    }
    
    if (user.companyRole === 'admin') {
      // Admin cannot assign owner or admin roles
      return !['owner', 'admin'].includes(targetRole);
    }
    
    return false;
  }

  /**
   * Check if user can assign ship role on specific ship
   */
  static canAssignShipRole(
    user: User, 
    targetRole: ShipRole, 
    shipId: string
  ): boolean {
    // Company owners/admins can assign any ship role
    if (['owner', 'admin'].includes(user.companyRole)) {
      return true;
    }

    // Masters can assign roles except other masters
    const userShipRole = user.shipRoles.find(role => role.shipId === shipId);
    if (userShipRole?.role === 'master') {
      return targetRole !== 'master';
    }

    return false;
  }

  /**
   * Get all resources a user has access to with their permissions
   */
  static getUserPermissions(user: User, shipId?: string): Record<Resource, Action[]> {
    const permissions: Partial<Record<Resource, Action[]>> = {};

    // Add company-level permissions
    const companyPermissions = COMPANY_POLICY[user.companyRole];
    if (companyPermissions) {
      Object.entries(companyPermissions).forEach(([resource, actions]) => {
        permissions[resource as Resource] = [...(actions || [])];
      });
    }

    // Add ship-level permissions if shipId provided
    if (shipId) {
      const shipRole = user.shipRoles.find(role => role.shipId === shipId);
      if (shipRole) {
        const shipPermissions = SHIP_POLICY[shipRole.role];
        Object.entries(shipPermissions).forEach(([resource, actions]) => {
          const existingActions = permissions[resource as Resource] || [];
          const newActions = actions || [];
          // Merge actions, avoiding duplicates
          permissions[resource as Resource] = [...new Set([...existingActions, ...newActions])];
        });
      }
    }

    return permissions as Record<Resource, Action[]>;
  }

  /**
   * Get all ships user has access to with their roles
   */
  static getUserShipAccess(user: User): Array<{shipId: string, role: ShipRole, permissions: Record<Resource, Action[]>}> {
    return user.shipRoles.map(shipRole => ({
      shipId: shipRole.shipId,
      role: shipRole.role,
      permissions: this.getUserPermissions(user, shipRole.shipId)
    }));
  }

  /**
   * Check if user has any access to a specific ship
   */
  static hasShipAccess(user: User, shipId: string): boolean {
    // Company owners/admins have access to all ships
    if (['owner', 'admin'].includes(user.companyRole)) {
      return true;
    }

    // Check if user has specific role on this ship
    return user.shipRoles.some(role => role.shipId === shipId);
  }

  /**
   * Get user's role hierarchy score (higher = more permissions)
   */
  static getRoleHierarchy(companyRole: CompanyRole, shipRole?: ShipRole): number {
    const companyScores: Record<CompanyRole, number> = {
      owner: 100,
      admin: 90,
      hr: 60,
      procurement: 60,
      finance: 60,
      viewer: 10
    };

    const shipScores: Record<ShipRole, number> = {
      master: 80,
      chief_engineer: 70,
      chief_officer: 65,
      officer_2: 50,
      officer_3: 45,
      bosun: 40,
      ship_procurement: 35,
      ship_crew_manager: 30,
      viewer_ship: 5
    };

    const companyScore = companyScores[companyRole] || 0;
    const shipScore = shipRole ? shipScores[shipRole] : 0;
    
    return Math.max(companyScore, shipScore);
  }
}
