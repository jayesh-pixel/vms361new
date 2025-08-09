import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { IAMService } from '@/lib/iam/service';

export async function POST(request: NextRequest) {
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
    const { email, displayName, password, companyRole, shipRoles } = body;

    // Validate required fields
    if (!email || !displayName || !password || !companyRole) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, displayName, password, companyRole' 
      }, { status: 400 });
    }

    // Check if user can assign this company role
    if (!IAMService.canAssignCompanyRole(currentUser, companyRole)) {
      return NextResponse.json({ 
        error: 'Cannot assign this company role' 
      }, { status: 403 });
    }

    // Validate ship roles if provided
    if (shipRoles && Array.isArray(shipRoles)) {
      for (const shipRole of shipRoles) {
        if (!IAMService.canAssignShipRole(currentUser, shipRole.role, shipRole.shipId)) {
          return NextResponse.json({ 
            error: `Cannot assign ${shipRole.role} role on ship ${shipRole.shipId}` 
          }, { status: 403 });
        }
      }
    }

    // Create user directly in Firebase Auth
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create user in Firestore
    const userData = {
      uid: firebaseUser.uid,
      email,
      displayName,
      companyId: currentUser.companyId,
      companyRole,
      shipRoles: (shipRoles || []).map((role: any) => ({
        ...role,
        assignedAt: new Date(),
        assignedBy: currentUser.uid
      })),
      isActive: true,
      createdBy: currentUser.uid
    };

    const userId = await IAMFirestoreService.createUser(userData);

    return NextResponse.json({ 
      success: true, 
      userId,
      firebaseUid: firebaseUser.uid
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    // Get all users for current company
    const users = await IAMFirestoreService.getUsersByCompany(
      currentUser.companyId
    );

    return NextResponse.json({ users });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE endpoint removed - using direct user management instead
// Users are created directly and can be managed via /api/admin/users/[id]
