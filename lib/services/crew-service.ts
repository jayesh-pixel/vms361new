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
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CrewMember } from '@/lib/types/ships';

export class CrewService {
  private static readonly COLLECTION = 'crew';
  private static readonly SHIPS_COLLECTION = 'ships';
  private static readonly CREW_SUBCOLLECTION = 'crew';

  // Get all crew members for a company
  static async getCrewByCompany(companyId: string): Promise<CrewMember[]> {
    try {
      // Simple query without ordering to avoid index requirement
      const q = query(
        collection(db, this.COLLECTION),
        where('companyId', '==', companyId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort on client side to avoid index requirement
      const crewMembers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinDate: data.joinDate?.toDate(),
          contractEndDate: data.contractEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as CrewMember[];

      // Sort by name on client side
      return crewMembers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting crew by company:', error);
      throw error;
    }
  }

  // Get crew member by ID
  static async getCrewMember(crewId: string): Promise<CrewMember | null> {
    try {
      const docRef = doc(db, this.COLLECTION, crewId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          joinDate: data.joinDate?.toDate(),
          contractEndDate: data.contractEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as CrewMember;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting crew member:', error);
      throw error;
    }
  }

  // Update crew member
  static async updateCrewMember(crewId: string, updates: Partial<CrewMember>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, crewId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating crew member:', error);
      throw error;
    }
  }

  // Delete crew member
  static async deleteCrewMember(crewId: string): Promise<void> {
    try {
      // First, remove references from all ships
      await this.removeCrewFromAllShips(crewId);
      
      // Then delete the crew member from main collection
      const docRef = doc(db, this.COLLECTION, crewId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting crew member:', error);
      throw error;
    }
  }

  // Remove crew member references from all ships
  private static async removeCrewFromAllShips(crewId: string): Promise<void> {
    try {
      // Get the crew member to find their current ship
      const crewMember = await this.getCrewMember(crewId);
      if (!crewMember || !crewMember.shipId) {
        return;
      }

      // Remove from ship's crew subcollection
      const shipRef = doc(db, this.SHIPS_COLLECTION, crewMember.shipId);
      const crewReferencesQuery = query(
        collection(shipRef, this.CREW_SUBCOLLECTION),
        where('crewId', '==', crewId)
      );
      const referencesSnapshot = await getDocs(crewReferencesQuery);
      
      // Delete all references (there should typically be only one)
      const deletePromises = referencesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error removing crew from ships:', error);
      throw error;
    }
  }

  // Get all crew members (for admin use)
  static async getAllCrew(): Promise<CrewMember[]> {
    try {
      // Simple query without ordering to avoid index requirement
      const q = query(collection(db, this.COLLECTION));
      const querySnapshot = await getDocs(q);
      
      // Sort on client side
      const crewMembers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinDate: data.joinDate?.toDate(),
          contractEndDate: data.contractEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as CrewMember[];

      // Sort by name on client side
      return crewMembers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting all crew:', error);
      throw error;
    }
  }

  // Search crew members
  static async searchCrew(searchTerm: string, companyId?: string): Promise<CrewMember[]> {
    try {
      let q;
      if (companyId) {
        // Simple query without ordering to avoid index requirement
        q = query(
          collection(db, this.COLLECTION),
          where('companyId', '==', companyId)
        );
      } else {
        q = query(collection(db, this.COLLECTION));
      }
      
      const querySnapshot = await getDocs(q);
      
      // Filter and sort results on client side
      const allCrew = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinDate: data.joinDate?.toDate(),
          contractEndDate: data.contractEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as CrewMember[];

      const searchLower = searchTerm.toLowerCase();
      const filteredCrew = allCrew.filter(crew => 
        crew.name.toLowerCase().includes(searchLower) ||
        crew.rank.toLowerCase().includes(searchLower) ||
        crew.nationality?.toLowerCase().includes(searchLower) ||
        crew.contact?.email?.toLowerCase().includes(searchLower)
      );

      // Sort by name
      return filteredCrew.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error searching crew:', error);
      throw error;
    }
  }
}
