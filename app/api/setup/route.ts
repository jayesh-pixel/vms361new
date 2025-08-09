import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { IAMFirestoreService } from '@/lib/iam/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setupToken, companyName, adminEmail, adminDisplayName } = body;

    // For regular registration (no setup token needed)
    // For manual setup (requires setup token)
    if (setupToken && setupToken !== 'setup123') {
      return NextResponse.json({ error: 'Invalid setup token' }, { status: 401 });
    }

    // Get the admin user from Firebase Auth
    let adminUser;
    try {
      adminUser = await adminAuth.getUserByEmail(adminEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: 'Admin user not found in Firebase Auth. Please register first.' 
        }, { status: 404 });
      }
      throw error;
    }

    // Check if user already has a company (avoid duplicates)
    const existingUser = await IAMFirestoreService.getUserByUID(adminUser.uid);
    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        companyId: existingUser.companyId 
      });
    }

    // Create company first
    const companyId = await IAMFirestoreService.createCompany({
      name: companyName,
      address: '',
      phone: '',
      email: adminEmail,
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        enableNotifications: true,
        autoApprovalLimits: {
          requisition: 10000,
          purchaseOrder: 50000
        }
      }
    });

    // Create admin user in Firestore as company owner
    await IAMFirestoreService.createUser({
      uid: adminUser.uid,
      email: adminUser.email!,
      displayName: adminDisplayName || adminUser.displayName || 'Admin',
      companyId: companyId,
      companyRole: 'owner',
      shipRoles: [],
      isActive: true
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Company and owner account created successfully!',
      companyId 
    });

  } catch (error: any) {
    console.error('Error in setup:', error);
    return NextResponse.json({ 
      error: 'Setup failed: ' + error.message 
    }, { status: 500 });
  }
}
