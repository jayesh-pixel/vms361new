import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { IAMService } from '@/lib/iam/service';
import { User, CompanyRole, ShipRole } from '@/lib/types/iam';

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
    const { email, password, displayName, companyRole, shipRoles } = body;

    // Validate input
    if (!email || !password || !displayName || !companyRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if current user can assign the requested company role
    if (!IAMService.canAssignCompanyRole(currentUser, companyRole as CompanyRole)) {
      return NextResponse.json({ 
        error: 'Cannot assign this company role' 
      }, { status: 403 });
    }

    // Check ship role permissions
    if (shipRoles && Array.isArray(shipRoles)) {
      for (const shipRole of shipRoles) {
        if (!IAMService.canAssignShipRole(currentUser, shipRole.role, shipRole.shipId)) {
          return NextResponse.json({ 
            error: `Cannot assign ${shipRole.role} role on ship ${shipRole.shipId}` 
          }, { status: 403 });
        }
      }
    }

    // Create Firebase user (this won't affect current session since it's server-side)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create user document in Firestore
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      uid: userRecord.uid,
      email: userRecord.email || email,
      displayName: userRecord.displayName || displayName,
      photoURL: userRecord.photoURL,
      phone: userRecord.phoneNumber,
      companyId: currentUser.companyId,
      companyRole: companyRole as CompanyRole,
      shipRoles: (shipRoles || []).map((role: any) => ({
        ...role,
        assignedAt: new Date(),
        assignedBy: currentUser.uid
      })),
      isActive: true,
      createdBy: currentUser.uid,
    };

    const userId = await IAMFirestoreService.createUser(userData);

    return NextResponse.json({ 
      success: true, 
      userId,
      userRecord: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ 
        error: 'Email already exists' 
      }, { status: 400 });
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({ 
        error: 'Password is too weak' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get current user
    const currentUser = await IAMFirestoreService.getUserByUID(decodedToken.uid);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get users in the same company
    const users = await IAMFirestoreService.getUsersByCompany(currentUser.companyId);
    
    // Filter out sensitive information
    const safeUsers = users.map(user => ({
      id: user.id,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phone: user.phone,
      companyRole: user.companyRole,
      shipRoles: user.shipRoles,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: safeUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
