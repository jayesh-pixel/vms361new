import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { IAMService } from '@/lib/iam/service';
import { CompanyRole, ShipRole } from '@/lib/types/iam';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get current user to check permissions
    const currentUser = await IAMFirestoreService.getUserByUID(decodedToken.uid);
    if (!currentUser || !IAMService.canManageRoles(currentUser)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { companyRole, shipRoles, isActive } = body;
    const userId = params.id;

    // Get target user
    const targetUser = await IAMFirestoreService.getUserById(userId);
    if (!targetUser || targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare updates
    const updates: any = {};

    // Update company role if provided
    if (companyRole && companyRole !== targetUser.companyRole) {
      if (!IAMService.canAssignCompanyRole(currentUser, companyRole as CompanyRole)) {
        return NextResponse.json({ 
          error: 'Cannot assign this company role' 
        }, { status: 403 });
      }
      updates.companyRole = companyRole;
    }

    // Update ship roles if provided
    if (shipRoles && Array.isArray(shipRoles)) {
      for (const shipRole of shipRoles) {
        if (!IAMService.canAssignShipRole(currentUser, shipRole.role, shipRole.shipId)) {
          return NextResponse.json({ 
            error: `Cannot assign ${shipRole.role} role on ship ${shipRole.shipId}` 
          }, { status: 403 });
        }
      }
      
      updates.shipRoles = shipRoles.map((role: any) => ({
        ...role,
        assignedAt: new Date(),
        assignedBy: currentUser.uid
      }));
    }

    // Update active status if provided
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
      
      // If deactivating user, also disable in Firebase Auth
      if (!isActive) {
        await adminAuth.updateUser(targetUser.uid, { disabled: true });
      } else {
        await adminAuth.updateUser(targetUser.uid, { disabled: false });
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await IAMFirestoreService.updateUser(userId, updates);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get current user to check permissions
    const currentUser = await IAMFirestoreService.getUserByUID(decodedToken.uid);
    if (!currentUser || !IAMService.canManageRoles(currentUser)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = params.id;

    // Get target user
    const targetUser = await IAMFirestoreService.getUserById(userId);
    if (!targetUser || targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (targetUser.uid === currentUser.uid) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Only owners can delete admins
    if (targetUser.companyRole === 'admin' && currentUser.companyRole !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete admins' }, { status: 403 });
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(targetUser.uid);
    
    // Delete from Firestore (we'll just deactivate to preserve data integrity)
    await IAMFirestoreService.deactivateUser(userId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
