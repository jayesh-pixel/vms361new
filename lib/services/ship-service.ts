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
  writeBatch,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/lib/storage-service';
import { 
  Ship, 
  CreateShipRequest, 
  UpdateShipRequest, 
  CrewMember, 
  Certificate, 
  Drawing,
  InventoryItem, 
  Requisition, 
  Task,
  ShipStats 
} from '@/lib/types/ships';

export class ShipService {
  private static COLLECTION = 'ships';
  private static CREW_COLLECTION = 'crew'; // Main crew collection
  private static CREW_SUBCOLLECTION = 'crew'; // Ship crew references
  private static CERTIFICATES_SUBCOLLECTION = 'certificates';
  private static DRAWINGS_SUBCOLLECTION = 'drawings';
  private static INVENTORY_SUBCOLLECTION = 'inventory';
  private static REQUISITIONS_SUBCOLLECTION = 'requisitions';
  private static TASKS_SUBCOLLECTION = 'tasks';

  // Ship CRUD Operations
  static async createShip(shipData: CreateShipRequest & { image?: File | null }, companyId: string, userId: string): Promise<string> {
    try {
      // First create the ship document to get the shipId
      const { image, ...shipDataWithoutImage } = shipData;
      
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...shipDataWithoutImage,
        imageUrl: null, // Will be updated after image upload
        companyId,
        createdBy: userId,
        crew: [],
        certificates: [],
        inventory: [],
        requisitions: [],
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Handle image upload if provided
      let imageUrl: string | null = null;
      if (image) {
        const imagePath = `ships/${docRef.id}/${Date.now()}_${image.name}`;
        imageUrl = await storageService.uploadFile(image, imagePath);
        
        // Update the document with the image URL
        await updateDoc(docRef, {
          imageUrl: imageUrl,
          updatedAt: new Date()
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating ship:', error);
      throw error;
    }
  }

  static async getShipById(id: string): Promise<Ship | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          location: {
            ...data.location,
            lastUpdate: data.location?.lastUpdate?.toDate()
          }
        } as Ship;
      }
      return null;
    } catch (error) {
      console.error('Error getting ship:', error);
      throw error;
    }
  }

  static async getShipsByCompany(companyId: string): Promise<Ship[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION), 
        where('companyId', '==', companyId),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          location: {
            ...data.location,
            lastUpdate: data.location?.lastUpdate?.toDate()
          }
        };
      }) as Ship[];
    } catch (error) {
      console.error('Error getting ships by company:', error);
      throw error;
    }
  }

  static async updateShip(id: string, updates: UpdateShipRequest): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating ship:', error);
      throw error;
    }
  }

  static async deleteShip(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting ship:', error);
      throw error;
    }
  }

  // Crew Management
  static async addCrewMember(shipId: string, crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get ship data to get companyId
      const shipDoc = await getDoc(doc(db, this.COLLECTION, shipId));
      if (!shipDoc.exists()) {
        throw new Error('Ship not found');
      }
      const shipData = shipDoc.data();
      
      // Build the crew object explicitly, only including defined values
      const newCrew: any = {
        name: crewData.name || "",
        rank: crewData.rank || "",
        nationality: crewData.nationality || "",
        joinDate: crewData.joinDate instanceof Date ? crewData.joinDate : new Date(crewData.joinDate || new Date()),
        certificates: Array.isArray(crewData.certificates) ? crewData.certificates : [],
        contact: {
          email: crewData.contact?.email || "",
          phone: crewData.contact?.phone || "",
          emergencyContact: crewData.contact?.emergencyContact || ""
        },
        status: crewData.status || "active",
        shipId: shipId, // Add reference to the ship
        companyId: shipData.companyId, // Add company reference
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they have valid values
      if (crewData.contractEndDate && crewData.contractEndDate !== undefined && crewData.contractEndDate !== null) {
        newCrew.contractEndDate = crewData.contractEndDate instanceof Date ? crewData.contractEndDate : new Date(crewData.contractEndDate);
      }

      if (crewData.salary !== undefined && crewData.salary !== null && crewData.salary !== 0) {
        const salaryNum = typeof crewData.salary === 'string' ? parseFloat(crewData.salary) : crewData.salary;
        if (!isNaN(salaryNum) && salaryNum > 0) {
          newCrew.salary = salaryNum;
        }
      }
      
      if (crewData.currency && crewData.currency !== undefined && crewData.currency !== null) {
        newCrew.currency = crewData.currency;
      }
      
      if (crewData.jobType && crewData.jobType !== undefined && crewData.jobType !== null) {
        newCrew.jobType = crewData.jobType;
      }

      // Step 1: Add crew member to main crew collection
      const crewDocRef = await addDoc(collection(db, this.CREW_COLLECTION), newCrew);
      const crewId = crewDocRef.id;
      
      // Step 2: Add reference to ship's crew subcollection
      const shipRef = doc(db, this.COLLECTION, shipId);
      const crewReference = {
        crewId: crewId,
        name: newCrew.name,
        rank: newCrew.rank,
        status: newCrew.status,
        addedAt: new Date()
      };
      
      await addDoc(collection(shipRef, this.CREW_SUBCOLLECTION), crewReference);
      
      return crewId;
    } catch (error) {
      console.error('Error adding crew member:', error);
      throw error;
    }
  }

  static async getShipCrew(shipId: string): Promise<CrewMember[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const crewReferencesQuery = query(collection(shipRef, this.CREW_SUBCOLLECTION));
      const referencesSnapshot = await getDocs(crewReferencesQuery);
      
      // Get crew IDs from references
      const crewIds = referencesSnapshot.docs
        .map(doc => doc.data().crewId)
        .filter(id => id && typeof id === 'string'); // Filter out undefined/invalid IDs
      
      if (crewIds.length === 0) {
        return [];
      }
      
      // Fetch actual crew data from main crew collection
      const crewMembers: CrewMember[] = [];
      
      for (const crewId of crewIds) {
        if (!crewId) continue; // Additional safety check
        const crewDoc = await getDoc(doc(db, this.CREW_COLLECTION, crewId));
        if (crewDoc.exists()) {
          const data = crewDoc.data();
          crewMembers.push({
            id: crewDoc.id,
            ...data,
            joinDate: data.joinDate?.toDate(),
            contractEndDate: data.contractEndDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as CrewMember);
        }
      }
      
      return crewMembers;
    } catch (error) {
      console.error('Error getting ship crew:', error);
      throw error;
    }
  }

  // Certificate Management
  static async addCertificate(shipId: string, certData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const certRef = doc(collection(shipRef, this.CERTIFICATES_SUBCOLLECTION));
      
      // Calculate certificate status
      const now = new Date();
      const expiryDate = new Date(certData.expiryDate);
      const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: Certificate['status'] = 'valid';
      if (daysToExpiry < 0) {
        status = 'expired';
      } else if (daysToExpiry <= certData.reminderDays) {
        status = 'expiring_soon';
      }

      const newCert = {
        ...certData,
        id: certRef.id,
        status,
        issueDate: certData.issueDate,
        expiryDate: certData.expiryDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(shipRef, this.CERTIFICATES_SUBCOLLECTION), newCert);
      return certRef.id;
    } catch (error) {
      console.error('Error adding certificate:', error);
      throw error;
    }
  }

  static async getShipCertificates(shipId: string): Promise<Certificate[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const certQuery = query(collection(shipRef, this.CERTIFICATES_SUBCOLLECTION));
      const querySnapshot = await getDocs(certQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          issueDate: data.issueDate?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Certificate[];
    } catch (error) {
      console.error('Error getting ship certificates:', error);
      throw error;
    }
  }

  // Drawing Management
  static async addDrawing(shipId: string, drawingData: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const drawingRef = doc(collection(shipRef, this.DRAWINGS_SUBCOLLECTION));
      
      const newDrawing = {
        ...drawingData,
        id: drawingRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(shipRef, this.DRAWINGS_SUBCOLLECTION), newDrawing);
      return drawingRef.id;
    } catch (error) {
      console.error('Error adding drawing:', error);
      throw error;
    }
  }

  static async getShipDrawings(shipId: string): Promise<Drawing[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const drawingQuery = query(collection(shipRef, this.DRAWINGS_SUBCOLLECTION));
      const querySnapshot = await getDocs(drawingQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Drawing[];
    } catch (error) {
      console.error('Error getting ship drawings:', error);
      throw error;
    }
  }

  static async updateDrawing(shipId: string, drawingId: string, updates: Partial<Drawing>): Promise<void> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const drawingRef = doc(collection(shipRef, this.DRAWINGS_SUBCOLLECTION), drawingId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(drawingRef, updateData);
    } catch (error) {
      console.error('Error updating drawing:', error);
      throw error;
    }
  }

  static async deleteDrawing(shipId: string, drawingId: string): Promise<void> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const drawingRef = doc(collection(shipRef, this.DRAWINGS_SUBCOLLECTION), drawingId);
      
      await deleteDoc(drawingRef);
    } catch (error) {
      console.error('Error deleting drawing:', error);
      throw error;
    }
  }

  // Inventory Management
  static async addInventoryItem(shipId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const itemRef = doc(collection(shipRef, this.INVENTORY_SUBCOLLECTION));
      
      const newItem = {
        ...itemData,
        id: itemRef.id,
        lastStockUpdate: itemData.lastStockUpdate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(shipRef, this.INVENTORY_SUBCOLLECTION), newItem);
      return itemRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  static async updateInventoryStock(shipId: string, itemId: string, newStock: number): Promise<void> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const itemRef = doc(collection(shipRef, this.INVENTORY_SUBCOLLECTION), itemId);
      
      await updateDoc(itemRef, {
        currentStock: newStock,
        lastStockUpdate: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating inventory stock:', error);
      throw error;
    }
  }

  static async getShipInventory(shipId: string): Promise<InventoryItem[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const inventoryQuery = query(collection(shipRef, this.INVENTORY_SUBCOLLECTION));
      const querySnapshot = await getDocs(inventoryQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          lastStockUpdate: data.lastStockUpdate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as InventoryItem[];
    } catch (error) {
      console.error('Error getting ship inventory:', error);
      throw error;
    }
  }

  // Requisition Management
  static async createRequisition(shipId: string, reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const reqRef = doc(collection(shipRef, this.REQUISITIONS_SUBCOLLECTION));
      
      const newReq = {
        ...reqData,
        id: reqRef.id,
        requestDate: reqData.requestDate,
        requiredDate: reqData.requiredDate,
        approvalDate: reqData.approvalDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(shipRef, this.REQUISITIONS_SUBCOLLECTION), newReq);
      return reqRef.id;
    } catch (error) {
      console.error('Error creating requisition:', error);
      throw error;
    }
  }

  static async updateRequisitionStatus(shipId: string, reqId: string, status: Requisition['status'], approvedBy?: string): Promise<void> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const reqRef = doc(collection(shipRef, this.REQUISITIONS_SUBCOLLECTION), reqId);
      
      const updates: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved' && approvedBy) {
        updates.approvedBy = approvedBy;
        updates.approvalDate = new Date();
      }

      await updateDoc(reqRef, updates);
    } catch (error) {
      console.error('Error updating requisition status:', error);
      throw error;
    }
  }

  static async getShipRequisitions(shipId: string): Promise<Requisition[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const reqQuery = query(collection(shipRef, this.REQUISITIONS_SUBCOLLECTION), orderBy('requestDate', 'desc'));
      const querySnapshot = await getDocs(reqQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          requestDate: data.requestDate?.toDate(),
          requiredDate: data.requiredDate?.toDate(),
          approvalDate: data.approvalDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Requisition[];
    } catch (error) {
      console.error('Error getting ship requisitions:', error);
      throw error;
    }
  }

  // Task Management
  static async createTask(shipId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const taskRef = doc(collection(shipRef, this.TASKS_SUBCOLLECTION));
      
      const newTask = {
        ...taskData,
        id: taskRef.id,
        dueDate: taskData.dueDate,
        completedAt: taskData.completedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(shipRef, this.TASKS_SUBCOLLECTION), newTask);
      return taskRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async updateTaskStatus(shipId: string, taskId: string, status: Task['status'], completionNotes?: string): Promise<void> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const taskRef = doc(collection(shipRef, this.TASKS_SUBCOLLECTION), taskId);
      
      const updates: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'completed') {
        updates.completedAt = new Date();
        if (completionNotes) {
          updates.completionNotes = completionNotes;
        }
      }

      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  static async getShipTasks(shipId: string): Promise<Task[]> {
    try {
      const shipRef = doc(db, this.COLLECTION, shipId);
      const taskQuery = query(collection(shipRef, this.TASKS_SUBCOLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(taskQuery);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dueDate: data.dueDate?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Task[];
    } catch (error) {
      console.error('Error getting ship tasks:', error);
      throw error;
    }
  }

  // Analytics and Stats
  static async getCompanyShipStats(companyId: string): Promise<ShipStats> {
    try {
      const ships = await this.getShipsByCompany(companyId);
      
      const stats: ShipStats = {
        totalShips: ships.length,
        byStatus: {
          at_sea: 0,
          in_port: 0,
          anchored: 0,
          maintenance: 0,
          emergency: 0
        },
        byType: {
          container: 0,
          bulk_carrier: 0,
          tanker: 0,
          cargo: 0,
          passenger: 0,
          offshore: 0
        },
        activeTasks: 0,
        pendingRequisitions: 0,
        expiringCertificates: 0
      };

      // Calculate stats
      for (const ship of ships) {
        stats.byStatus[ship.status]++;
        stats.byType[ship.type]++;
        
        // Count tasks and requisitions
        stats.activeTasks += ship.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
        stats.pendingRequisitions += ship.requisitions?.filter(r => r.status === 'pending').length || 0;
        
        // Count expiring certificates
        const now = new Date();
        const expiringCount = ship.certificates?.filter(cert => {
          if (cert.status === 'expired') return true;
          if (cert.status === 'expiring_soon') return true;
          const daysToExpiry = Math.ceil((new Date(cert.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysToExpiry <= 30;
        }).length || 0;
        
        stats.expiringCertificates += expiringCount;
      }

      return stats;
    } catch (error) {
      console.error('Error getting ship stats:', error);
      throw error;
    }
  }
}
