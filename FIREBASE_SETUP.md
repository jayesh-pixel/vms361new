# Firebase Setup Guide

## Firebase and Firebase Admin SDK Setup

This project includes both Firebase client SDK and Firebase Admin SDK for comprehensive Firebase integration.

### 🔧 Installation

Firebase packages have been installed:
- `firebase` - Client-side SDK
- `firebase-admin` - Server-side SDK

### 📁 File Structure

```
lib/
├── firebase.ts          # Client-side Firebase configuration
├── firebase-admin.ts    # Server-side Firebase Admin configuration
├── firestore-service.ts # Firestore CRUD operations
└── storage-service.ts   # Firebase Storage operations

hooks/
└── use-auth.ts          # Authentication hook
```

### ⚙️ Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Firestore, and Storage

2. **Get Client Configuration**
   - In Firebase Console, go to Project Settings
   - Add a web app and copy the configuration

3. **Setup Service Account (for Admin SDK)**
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file

4. **Update Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration:

```env
# Client-side Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Server-side Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### 🚀 Usage Examples

#### Authentication
```tsx
import { useAuth } from '@/hooks/use-auth';

function LoginComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  // Use authentication methods
}
```

#### Firestore Operations
```tsx
import { firestoreService } from '@/lib/firestore-service';

// Create document
const id = await firestoreService.create('users', { name: 'John', email: 'john@example.com' });

// Get document
const user = await firestoreService.getById('users', id);

// Update document
await firestoreService.update('users', id, { name: 'Jane' });
```

#### Storage Operations
```tsx
import { storageService } from '@/lib/storage-service';

// Upload file
const downloadURL = await storageService.uploadFile(file, 'uploads/image.jpg');

// Upload multiple files
const urls = await storageService.uploadFiles(files, 'uploads');
```

#### Server-side Operations
```tsx
// In API routes (app/api/*)
import { adminAuth, adminDB } from '@/lib/firebase-admin';

// Verify token
const decodedToken = await adminAuth.verifyIdToken(idToken);

// Server-side Firestore operations
const doc = await adminDB.collection('users').doc(uid).get();
```

### 🔒 Security Rules

Remember to configure Firebase Security Rules for Firestore and Storage based on your needs.

### 📝 Notes

- Client-side configuration uses `NEXT_PUBLIC_` prefix (exposed to browser)
- Admin configuration uses regular environment variables (server-only)
- Admin SDK is automatically initialized on first import
- Client SDK includes Analytics with browser detection
