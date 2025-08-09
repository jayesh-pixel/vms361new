import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Company, UserInvite, CompanyRole, ShipRole, ShipRoleAssignment } from '@/lib/types/iam';

export class IAMFirestoreService {
  // Collections
  private static USERS = 'users';
  private static COMPANIES = 'companies';
  private static INVITES = 'user_invites';

  /**
   * User Management
   */
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.USERS), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserByUID(uid: string): Promise<User | null> {
    try {
      const q = query(collection(db, this.USERS), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by UID:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.USERS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async getUsersByCompany(companyId: string): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.USERS), 
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users by company:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, this.USERS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async assignShipRole(
    userId: string, 
    shipId: string, 
    shipName: string,
    role: ShipRole, 
    assignedBy: string
  ): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const existingRoleIndex = user.shipRoles.findIndex(r => r.shipId === shipId);
      const newRoleAssignment: ShipRoleAssignment = {
        shipId,
        shipName,
        role,
        assignedAt: new Date(),
        assignedBy
      };

      let updatedShipRoles: ShipRoleAssignment[];
      if (existingRoleIndex >= 0) {
        // Update existing role
        updatedShipRoles = [...user.shipRoles];
        updatedShipRoles[existingRoleIndex] = newRoleAssignment;
      } else {
        // Add new role
        updatedShipRoles = [...user.shipRoles, newRoleAssignment];
      }

      await this.updateUser(userId, { shipRoles: updatedShipRoles });
    } catch (error) {
      console.error('Error assigning ship role:', error);
      throw error;
    }
  }

  static async removeShipRole(userId: string, shipId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      const updatedShipRoles = user.shipRoles.filter(role => role.shipId !== shipId);
      await this.updateUser(userId, { shipRoles: updatedShipRoles });
    } catch (error) {
      console.error('Error removing ship role:', error);
      throw error;
    }
  }

  static async updateCompanyRole(userId: string, newRole: CompanyRole): Promise<void> {
    try {
      await this.updateUser(userId, { companyRole: newRole });
    } catch (error) {
      console.error('Error updating company role:', error);
      throw error;
    }
  }

  static async deactivateUser(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { isActive: false });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Company Management
   */
  static async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COMPANIES), {
        ...companyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  static async getCompanyById(id: string): Promise<Company | null> {
    try {
      const docRef = doc(db, this.COMPANIES, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Company;
      }
      return null;
    } catch (error) {
      console.error('Error getting company:', error);
      throw error;
    }
  }

  static async updateCompany(id: string, updates: Partial<Company>): Promise<void> {
    try {
      const docRef = doc(db, this.COMPANIES, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * User Invites
   */
  static async createInvite(inviteData: Omit<UserInvite, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.INVITES), {
        ...inviteData,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invite:', error);
      throw error;
    }
  }

  static async getInviteByToken(token: string): Promise<UserInvite | null> {
    try {
      const q = query(
        collection(db, this.INVITES), 
        where('inviteToken', '==', token),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserInvite;
    } catch (error) {
      console.error('Error getting invite by token:', error);
      throw error;
    }
  }

  static async getInvitesByCompany(companyId: string): Promise<UserInvite[]> {
    try {
      const q = query(
        collection(db, this.INVITES), 
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserInvite[];
    } catch (error) {
      console.error('Error getting invites by company:', error);
      throw error;
    }
  }

  static async updateInviteStatus(inviteId: string, status: 'accepted' | 'expired'): Promise<void> {
    try {
      const docRef = doc(db, this.INVITES, inviteId);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating invite status:', error);
      throw error;
    }
  }

  static async deleteInvite(inviteId: string): Promise<void> {
    try {
      const docRef = doc(db, this.INVITES, inviteId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invite:', error);
      throw error;
    }
  }

  /**
   * Bulk Operations
   */
  static async updateUsersShipName(shipId: string, newShipName: string): Promise<void> {
    try {
      const users = await getDocs(collection(db, this.USERS));
      const batch = writeBatch(db);
      
      users.docs.forEach(userDoc => {
        const userData = userDoc.data() as User;
        const updatedShipRoles = userData.shipRoles?.map(role => 
          role.shipId === shipId ? { ...role, shipName: newShipName } : role
        );
        
        if (updatedShipRoles && updatedShipRoles.some(role => role.shipId === shipId)) {
          batch.update(userDoc.ref, { 
            shipRoles: updatedShipRoles,
            updatedAt: new Date()
          });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating users ship name:', error);
      throw error;
    }
  }

  static async removeShipFromAllUsers(shipId: string): Promise<void> {
    try {
      const users = await getDocs(collection(db, this.USERS));
      const batch = writeBatch(db);
      
      users.docs.forEach(userDoc => {
        const userData = userDoc.data() as User;
        const updatedShipRoles = userData.shipRoles?.filter(role => role.shipId !== shipId);
        
        if (userData.shipRoles?.some(role => role.shipId === shipId)) {
          batch.update(userDoc.ref, { 
            shipRoles: updatedShipRoles,
            updatedAt: new Date()
          });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing ship from all users:', error);
      throw error;
    }
  }
}
