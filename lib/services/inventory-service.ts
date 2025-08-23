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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  subCategory?: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  location: string;
  shipId: string;
  supplier?: string;
  unitCost?: number;
  totalValue?: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  batchNumber?: string;
  serialNumber?: string;
  status: InventoryStatus;
  notes?: string;
}

export type InventoryCategory = 
  | 'engine_parts'
  | 'deck_equipment'
  | 'navigation'
  | 'safety_equipment'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'galley'
  | 'medical'
  | 'cleaning'
  | 'office_supplies'
  | 'spare_parts'
  | 'consumables'
  | 'chemicals'
  | 'lubricants'
  | 'tools'
  | 'emergency'
  | 'other';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order' | 'reserved' | 'expired';

export interface CreateInventoryItemRequest {
  partNumber: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  subCategory?: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  location: string;
  shipId: string;
  supplier?: string;
  unitCost?: number;
  expiryDate?: Date;
  batchNumber?: string;
  serialNumber?: string;
  notes?: string;
}

export interface UpdateInventoryItemRequest {
  partNumber?: string;
  name?: string;
  description?: string;
  category?: InventoryCategory;
  subCategory?: string;
  quantity?: number;
  unit?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  location?: string;
  supplier?: string;
  unitCost?: number;
  expiryDate?: Date;
  batchNumber?: string;
  serialNumber?: string;
  notes?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringSoon: number;
  reorderNeeded: number;
  categories: { [key: string]: number };
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string; // requisition id, task id, etc.
  performedBy: string;
  date: Date;
  notes?: string;
}

export class InventoryService {
  private static COLLECTION = 'inventory';
  private static MOVEMENTS_COLLECTION = 'stock_movements';

  // Create inventory item
  static async createInventoryItem(itemData: CreateInventoryItemRequest): Promise<string> {
    try {
      const now = new Date();
      const totalValue = (itemData.unitCost || 0) * itemData.quantity;
      
      // Determine status based on quantity
      let status: InventoryStatus = 'in_stock';
      if (itemData.quantity === 0) {
        status = 'out_of_stock';
      } else if (itemData.quantity <= itemData.reorderPoint) {
        status = 'low_stock';
      }

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...itemData,
        totalValue,
        status,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now,
      });

      // Log the initial stock movement
      await this.logStockMovement({
        inventoryItemId: docRef.id,
        type: 'in',
        quantity: itemData.quantity,
        previousQuantity: 0,
        newQuantity: itemData.quantity,
        reason: 'Initial stock',
        performedBy: 'system', // This should be the current user
        date: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Get all inventory items for a ship
  static async getShipInventory(shipId: string): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('shipId', '==', shipId),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate(),
      } as InventoryItem));
    } catch (error) {
      console.error('Error fetching ship inventory:', error);
      throw error;
    }
  }

  // Get all inventory items across all ships
  static async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate(),
      } as InventoryItem));
    } catch (error) {
      console.error('Error fetching all inventory:', error);
      throw error;
    }
  }

  // Update inventory item
  static async updateInventoryItem(itemId: string, updates: UpdateInventoryItemRequest): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, itemId);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Inventory item not found');
      }

      const currentData = currentDoc.data() as InventoryItem;
      const now = new Date();
      
      // Calculate new total value if quantity or unit cost changed
      const newQuantity = updates.quantity ?? currentData.quantity;
      const newUnitCost = updates.unitCost ?? currentData.unitCost ?? 0;
      const totalValue = newUnitCost * newQuantity;

      // Determine new status
      const reorderPoint = updates.reorderPoint ?? currentData.reorderPoint;
      let status: InventoryStatus = 'in_stock';
      if (newQuantity === 0) {
        status = 'out_of_stock';
      } else if (newQuantity <= reorderPoint) {
        status = 'low_stock';
      }

      await updateDoc(docRef, {
        ...updates,
        totalValue,
        status,
        lastUpdated: now,
        updatedAt: now,
      });

      // Log stock movement if quantity changed
      if (updates.quantity !== undefined && updates.quantity !== currentData.quantity) {
        await this.logStockMovement({
          inventoryItemId: itemId,
          type: 'adjustment',
          quantity: Math.abs(updates.quantity - currentData.quantity),
          previousQuantity: currentData.quantity,
          newQuantity: updates.quantity,
          reason: 'Manual adjustment',
          performedBy: 'user', // This should be the current user
          date: now,
        });
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Delete inventory item
  static async deleteInventoryItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, itemId));
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Update stock quantity
  static async updateStock(
    itemId: string, 
    quantityChange: number, 
    type: 'in' | 'out' | 'adjustment' | 'transfer',
    reason: string,
    reference?: string,
    performedBy: string = 'user'
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, itemId);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) {
        throw new Error('Inventory item not found');
      }

      const currentData = currentDoc.data() as InventoryItem;
      const previousQuantity = currentData.quantity;
      const newQuantity = Math.max(0, previousQuantity + (type === 'out' ? -quantityChange : quantityChange));
      
      // Determine new status
      let status: InventoryStatus = 'in_stock';
      if (newQuantity === 0) {
        status = 'out_of_stock';
      } else if (newQuantity <= currentData.reorderPoint) {
        status = 'low_stock';
      }

      const now = new Date();
      const totalValue = (currentData.unitCost || 0) * newQuantity;

      await updateDoc(docRef, {
        quantity: newQuantity,
        totalValue,
        status,
        lastUpdated: now,
        updatedAt: now,
      });

      // Log the stock movement
      await this.logStockMovement({
        inventoryItemId: itemId,
        type,
        quantity: quantityChange,
        previousQuantity,
        newQuantity,
        reason,
        reference,
        performedBy,
        date: now,
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Get inventory statistics
  static async getInventoryStats(shipId?: string): Promise<InventoryStats> {
    try {
      let q;
      if (shipId) {
        q = query(collection(db, this.COLLECTION), where('shipId', '==', shipId));
      } else {
        q = query(collection(db, this.COLLECTION));
      }
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as InventoryItem));

      const stats: InventoryStats = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.totalValue || 0), 0),
        lowStockItems: items.filter(item => item.status === 'low_stock').length,
        outOfStockItems: items.filter(item => item.status === 'out_of_stock').length,
        expiringSoon: items.filter(item => {
          if (!item.expiryDate) return false;
          const daysUntilExpiry = Math.ceil((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }).length,
        reorderNeeded: items.filter(item => item.quantity <= item.reorderPoint).length,
        categories: {},
      };

      // Count items by category
      items.forEach(item => {
        stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw error;
    }
  }

  // Get low stock items
  static async getLowStockItems(shipId?: string): Promise<InventoryItem[]> {
    try {
      let q;
      if (shipId) {
        q = query(
          collection(db, this.COLLECTION),
          where('shipId', '==', shipId),
          where('status', 'in', ['low_stock', 'out_of_stock'])
        );
      } else {
        q = query(
          collection(db, this.COLLECTION),
          where('status', 'in', ['low_stock', 'out_of_stock'])
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate(),
      } as InventoryItem));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  // Get stock movements for an item
  static async getStockMovements(itemId: string): Promise<StockMovement[]> {
    try {
      const q = query(
        collection(db, this.MOVEMENTS_COLLECTION),
        where('inventoryItemId', '==', itemId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      } as StockMovement));
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  }

  // Log stock movement
  private static async logStockMovement(movement: Omit<StockMovement, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, this.MOVEMENTS_COLLECTION), movement);
    } catch (error) {
      console.error('Error logging stock movement:', error);
      throw error;
    }
  }

  // Search inventory items
  static async searchInventory(searchTerm: string, shipId?: string): Promise<InventoryItem[]> {
    try {
      let q;
      if (shipId) {
        q = query(collection(db, this.COLLECTION), where('shipId', '==', shipId));
      } else {
        q = query(collection(db, this.COLLECTION));
      }
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expiryDate: doc.data().expiryDate?.toDate(),
      } as InventoryItem));

      // Filter items based on search term
      const searchLower = searchTerm.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.partNumber.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }
}
