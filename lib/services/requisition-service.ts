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
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ExtendedRequisition, 
  PurchaseOrder, 
  WorkOrder, 
  Vendor, 
  VendorQuote, 
  AuditReport, 
  LegalDocument,
  RequisitionStats,
  PurchaseOrderStats,
  WorkOrderStats,
  VendorStats
} from '@/lib/types/requisition';

export class RequisitionService {
  // Collections
  private static REQUISITIONS = 'requisitions';
  private static PURCHASE_ORDERS = 'purchase_orders';
  private static WORK_ORDERS = 'work_orders';
  private static VENDORS = 'vendors';
  private static VENDOR_QUOTES = 'vendor_quotes';
  private static AUDIT_REPORTS = 'audit_reports';
  private static LEGAL_DOCUMENTS = 'legal_documents';

  // ============ REQUISITION MANAGEMENT ============

  static async createRequisition(reqData: Omit<ExtendedRequisition, 'id' | 'createdAt' | 'updatedAt' | 'prNumber'>): Promise<string> {
    try {
      // Generate PR Number
      const prNumber = await this.generatePRNumber();
      
      const newRequisition = {
        ...reqData,
        prNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.REQUISITIONS), newRequisition);
      return docRef.id;
    } catch (error) {
      console.error('Error creating requisition:', error);
      throw error;
    }
  }

  static async getRequisitionById(id: string): Promise<ExtendedRequisition | null> {
    try {
      const docSnap = await getDoc(doc(db, this.REQUISITIONS, id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          requestDate: data.requestDate?.toDate(),
          requiredDate: data.requiredDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ExtendedRequisition;
      }
      return null;
    } catch (error) {
      console.error('Error getting requisition:', error);
      throw error;
    }
  }

  static async getRequisitionsByCompany(companyId: string, filters?: {
    status?: string;
    type?: string;
    shipId?: string;
    department?: string;
    limit?: number;
  }): Promise<ExtendedRequisition[]> {
    try {
      let q = query(
        collection(db, this.REQUISITIONS),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.shipId) {
        q = query(q, where('shipId', '==', filters.shipId));
      }
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestDate: data.requestDate?.toDate(),
          requiredDate: data.requiredDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as ExtendedRequisition[];
    } catch (error) {
      console.error('Error getting requisitions:', error);
      throw error;
    }
  }

  static async updateRequisition(id: string, updates: Partial<ExtendedRequisition>): Promise<void> {
    try {
      await updateDoc(doc(db, this.REQUISITIONS, id), {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating requisition:', error);
      throw error;
    }
  }

  static async deleteRequisition(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.REQUISITIONS, id));
    } catch (error) {
      console.error('Error deleting requisition:', error);
      throw error;
    }
  }

  // ============ PURCHASE ORDER MANAGEMENT ============

  static async createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'poNumber'>): Promise<string> {
    try {
      // Generate PO Number
      const poNumber = await this.generatePONumber();
      
      const newPO = {
        ...poData,
        poNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.PURCHASE_ORDERS), newPO);
      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    try {
      const docSnap = await getDoc(doc(db, this.PURCHASE_ORDERS, id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          orderDate: data.orderDate?.toDate(),
          expectedDeliveryDate: data.expectedDeliveryDate?.toDate(),
          actualDeliveryDate: data.actualDeliveryDate?.toDate(),
          approvalDate: data.approvalDate?.toDate(),
          receivedDate: data.receivedDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PurchaseOrder;
      }
      return null;
    } catch (error) {
      console.error('Error getting purchase order:', error);
      throw error;
    }
  }

  static async getPurchaseOrdersByCompany(companyId: string, filters?: {
    status?: string;
    vendorId?: string;
    shipId?: string;
    limit?: number;
  }): Promise<PurchaseOrder[]> {
    try {
      let q = query(
        collection(db, this.PURCHASE_ORDERS),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.vendorId) {
        q = query(q, where('vendorId', '==', filters.vendorId));
      }
      if (filters?.shipId) {
        q = query(q, where('shipId', '==', filters.shipId));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orderDate: data.orderDate?.toDate(),
          expectedDeliveryDate: data.expectedDeliveryDate?.toDate(),
          actualDeliveryDate: data.actualDeliveryDate?.toDate(),
          approvalDate: data.approvalDate?.toDate(),
          receivedDate: data.receivedDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as PurchaseOrder[];
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      throw error;
    }
  }

  // ============ WORK ORDER MANAGEMENT ============

  static async createWorkOrder(woData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'woNumber'>): Promise<string> {
    try {
      // Generate WO Number
      const woNumber = await this.generateWONumber();
      
      const newWO = {
        ...woData,
        woNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.WORK_ORDERS), newWO);
      return docRef.id;
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  static async getWorkOrdersByCompany(companyId: string, filters?: {
    status?: string;
    type?: string;
    shipId?: string;
    assignedTo?: string;
    limit?: number;
  }): Promise<WorkOrder[]> {
    try {
      let q = query(
        collection(db, this.WORK_ORDERS),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.shipId) {
        q = query(q, where('shipId', '==', filters.shipId));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scheduledStartDate: data.scheduledStartDate?.toDate(),
          scheduledEndDate: data.scheduledEndDate?.toDate(),
          actualStartDate: data.actualStartDate?.toDate(),
          actualEndDate: data.actualEndDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as WorkOrder[];
    } catch (error) {
      console.error('Error getting work orders:', error);
      throw error;
    }
  }

  // ============ VENDOR MANAGEMENT ============

  static async createVendor(vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'vendorId' | 'totalOrders' | 'onTimeDeliveryRate' | 'qualityRating'>): Promise<string> {
    try {
      // Generate Vendor ID
      const vendorId = await this.generateVendorId();
      
      const newVendor = {
        ...vendorData,
        vendorId,
        totalOrders: 0,
        onTimeDeliveryRate: 0,
        qualityRating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.VENDORS), newVendor);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  static async getVendorsByCompany(companyId: string, filters?: {
    status?: string;
    category?: string;
    limit?: number;
  }): Promise<Vendor[]> {
    try {
      let q = query(
        collection(db, this.VENDORS),
        where('companyId', '==', companyId),
        orderBy('name', 'asc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as Vendor[];
    } catch (error) {
      console.error('Error getting vendors:', error);
      throw error;
    }
  }

  // ============ VENDOR QUOTES ============

  static async createVendorQuote(quoteData: Omit<VendorQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newQuote = {
        ...quoteData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.VENDOR_QUOTES), newQuote);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vendor quote:', error);
      throw error;
    }
  }

  static async getQuotesByRequisition(requisitionId: string): Promise<VendorQuote[]> {
    try {
      const q = query(
        collection(db, this.VENDOR_QUOTES),
        where('requisitionId', '==', requisitionId),
        orderBy('quoteDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          quoteDate: data.quoteDate?.toDate(),
          validUntil: data.validUntil?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as VendorQuote[];
    } catch (error) {
      console.error('Error getting quotes:', error);
      throw error;
    }
  }

  // ============ AUDIT REPORTS ============

  static async createAuditReport(auditData: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt' | 'auditNumber'>): Promise<string> {
    try {
      // Generate Audit Number
      const auditNumber = await this.generateAuditNumber();
      
      const newAudit = {
        ...auditData,
        auditNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.AUDIT_REPORTS), newAudit);
      return docRef.id;
    } catch (error) {
      console.error('Error creating audit report:', error);
      throw error;
    }
  }

  static async getAuditReportsByCompany(companyId: string, filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<AuditReport[]> {
    try {
      let q = query(
        collection(db, this.AUDIT_REPORTS),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          plannedStartDate: data.plannedStartDate?.toDate(),
          plannedEndDate: data.plannedEndDate?.toDate(),
          actualStartDate: data.actualStartDate?.toDate(),
          actualEndDate: data.actualEndDate?.toDate(),
          followUpDate: data.followUpDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as AuditReport[];
    } catch (error) {
      console.error('Error getting audit reports:', error);
      throw error;
    }
  }

  // ============ LEGAL DOCUMENTS ============

  static async createLegalDocument(docData: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newDoc = {
        ...docData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.LEGAL_DOCUMENTS), newDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating legal document:', error);
      throw error;
    }
  }

  static async getLegalDocumentsByCompany(companyId: string, filters?: {
    type?: string;
    status?: string;
    vendorId?: string;
    limit?: number;
  }): Promise<LegalDocument[]> {
    try {
      let q = query(
        collection(db, this.LEGAL_DOCUMENTS),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      if (filters?.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.vendorId) {
        q = query(q, where('vendorId', '==', filters.vendorId));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          issueDate: data.issueDate?.toDate(),
          expiryDate: data.expiryDate?.toDate(),
          renewalDate: data.renewalDate?.toDate(),
          nextReviewDate: data.nextReviewDate?.toDate(),
          lastReminderSent: data.lastReminderSent?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }) as LegalDocument[];
    } catch (error) {
      console.error('Error getting legal documents:', error);
      throw error;
    }
  }

  // ============ STATISTICS ============

  static async getRequisitionStats(companyId: string): Promise<RequisitionStats> {
    try {
      const q = query(
        collection(db, this.REQUISITIONS),
        where('companyId', '==', companyId)
      );

      const querySnapshot = await getDocs(q);
      const requisitions = querySnapshot.docs.map(doc => doc.data()) as ExtendedRequisition[];

      const stats: RequisitionStats = {
        totalRequisitions: requisitions.length,
        pendingApproval: requisitions.filter(r => r.status === 'pending').length,
        approved: requisitions.filter(r => r.status === 'approved').length,
        rejected: requisitions.filter(r => r.status === 'rejected').length,
        urgent: requisitions.filter(r => r.priority === 'urgent').length,
        totalValue: requisitions.reduce((sum, r) => sum + (r.totalCost || 0), 0),
        averageProcessingTime: 0, // Calculate based on actual data
        byDepartment: {},
        byMonth: {},
        byVendor: {}
      };

      return stats;
    } catch (error) {
      console.error('Error getting requisition stats:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  private static async generatePRNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `PR-${year}${month}-${timestamp}`;
  }

  private static async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${year}${month}-${timestamp}`;
  }

  private static async generateWONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `WO-${year}${month}-${timestamp}`;
  }

  private static async generateVendorId(): Promise<string> {
    const timestamp = Date.now().toString().slice(-8);
    return `VND-${timestamp}`;
  }

  private static async generateAuditNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `AUD-${year}${month}-${timestamp}`;
  }
}
