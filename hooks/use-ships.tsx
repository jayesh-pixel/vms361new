"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ShipService } from '@/lib/services/ship-service';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { 
  Ship, 
  CreateShipRequest, 
  UpdateShipRequest, 
  CrewMember, 
  Certificate, 
  InventoryItem, 
  Requisition, 
  Task,
  ShipStats 
} from '@/lib/types/ships';

interface ShipContextType {
  // State
  ships: Ship[];
  currentShip: Ship | null;
  stats: ShipStats | null;
  isLoading: boolean;
  error: string | null;

  // Ship CRUD
  createShip: (shipData: CreateShipRequest & { image?: File | null }) => Promise<string>;
  updateShip: (id: string, updates: UpdateShipRequest) => Promise<void>;
  deleteShip: (id: string) => Promise<void>;
  setCurrentShip: (ship: Ship | null) => void;
  refreshShips: () => Promise<void>;

  // Crew Management
  addCrewMember: (shipId: string, crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getShipCrew: (shipId: string) => Promise<CrewMember[]>;

  // Certificate Management
  addCertificate: (shipId: string, certData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string>;
  getShipCertificates: (shipId: string) => Promise<Certificate[]>;

  // Inventory Management
  addInventoryItem: (shipId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateInventoryStock: (shipId: string, itemId: string, newStock: number) => Promise<void>;
  getShipInventory: (shipId: string) => Promise<InventoryItem[]>;

  // Requisition Management
  createRequisition: (shipId: string, reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequisitionStatus: (shipId: string, reqId: string, status: Requisition['status'], approvedBy?: string) => Promise<void>;
  getShipRequisitions: (shipId: string) => Promise<Requisition[]>;

  // Task Management
  createTask: (shipId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTaskStatus: (shipId: string, taskId: string, status: Task['status'], completionNotes?: string) => Promise<void>;
  getShipTasks: (shipId: string) => Promise<Task[]>;

  // Utility functions
  getShipById: (id: string) => Ship | undefined;
  refreshStats: () => Promise<void>;
}

const ShipContext = createContext<ShipContextType | undefined>(undefined);

interface ShipProviderProps {
  children: ReactNode;
}

export function ShipProvider({ children }: ShipProviderProps) {
  const { user } = useAuth();
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShip, setCurrentShip] = useState<Ship | null>(null);
  const [stats, setStats] = useState<ShipStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ships when user changes
  useEffect(() => {
    if (user) {
      loadShips();
      loadStats();
    } else {
      setShips([]);
      setCurrentShip(null);
      setStats(null);
    }
  }, [user]);

  const loadShips = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get user's company
      const userData = await IAMFirestoreService.getUserByUID(user.uid);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Load ships for the company
      const companyShips = await ShipService.getShipsByCompany(userData.companyId);
      setShips(companyShips);
    } catch (err: any) {
      console.error('Error loading ships:', err);
      setError(err.message || 'Failed to load ships');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get user's company
      const userData = await IAMFirestoreService.getUserByUID(user.uid);
      if (!userData) return;

      // Load stats for the company
      const companyStats = await ShipService.getCompanyShipStats(userData.companyId);
      setStats(companyStats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const createShip = async (shipData: CreateShipRequest & { image?: File | null }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      // Get user's company
      const userData = await IAMFirestoreService.getUserByUID(user.uid);
      if (!userData) {
        throw new Error('User data not found');
      }

      // Create ship
      const shipId = await ShipService.createShip(shipData, userData.companyId, user.uid);
      
      // Refresh ships list
      await loadShips();
      await loadStats();

      return shipId;
    } catch (err: any) {
      console.error('Error creating ship:', err);
      setError(err.message || 'Failed to create ship');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShip = async (id: string, updates: UpdateShipRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await ShipService.updateShip(id, updates);
      
      // Update local state
      setShips(prev => prev.map(ship => 
        ship.id === id ? { ...ship, ...updates, updatedAt: new Date() } : ship
      ));

      // Update current ship if it's the one being updated
      if (currentShip?.id === id) {
        setCurrentShip(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }

      await loadStats();
    } catch (err: any) {
      console.error('Error updating ship:', err);
      setError(err.message || 'Failed to update ship');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShip = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await ShipService.deleteShip(id);
      
      // Remove from local state
      setShips(prev => prev.filter(ship => ship.id !== id));

      // Clear current ship if it's the one being deleted
      if (currentShip?.id === id) {
        setCurrentShip(null);
      }

      await loadStats();
    } catch (err: any) {
      console.error('Error deleting ship:', err);
      setError(err.message || 'Failed to delete ship');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshShips = async (): Promise<void> => {
    await loadShips();
    await loadStats();
  };

  const refreshStats = async (): Promise<void> => {
    await loadStats();
  };

  const getShipById = (id: string): Ship | undefined => {
    return ships.find(ship => ship.id === id);
  };

  // Crew Management
  const addCrewMember = async (shipId: string, crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const crewId = await ShipService.addCrewMember(shipId, crewData);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          const newCrew = {
            ...crewData,
            id: crewId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return { ...ship, crew: [...ship.crew, newCrew] };
        }
        return ship;
      }));

      return crewId;
    } catch (err: any) {
      console.error('Error adding crew member:', err);
      setError(err.message || 'Failed to add crew member');
      throw err;
    }
  };

  const getShipCrew = async (shipId: string): Promise<CrewMember[]> => {
    try {
      return await ShipService.getShipCrew(shipId);
    } catch (err: any) {
      console.error('Error getting ship crew:', err);
      throw err;
    }
  };

  // Certificate Management
  const addCertificate = async (shipId: string, certData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
    try {
      const certId = await ShipService.addCertificate(shipId, certData);
      
      // Refresh ships to get updated certificates
      await loadShips();
      
      return certId;
    } catch (err: any) {
      console.error('Error adding certificate:', err);
      setError(err.message || 'Failed to add certificate');
      throw err;
    }
  };

  const getShipCertificates = async (shipId: string): Promise<Certificate[]> => {
    try {
      return await ShipService.getShipCertificates(shipId);
    } catch (err: any) {
      console.error('Error getting ship certificates:', err);
      throw err;
    }
  };

  // Inventory Management
  const addInventoryItem = async (shipId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const itemId = await ShipService.addInventoryItem(shipId, itemData);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          const newItem = {
            ...itemData,
            id: itemId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return { ...ship, inventory: [...ship.inventory, newItem] };
        }
        return ship;
      }));

      return itemId;
    } catch (err: any) {
      console.error('Error adding inventory item:', err);
      setError(err.message || 'Failed to add inventory item');
      throw err;
    }
  };

  const updateInventoryStock = async (shipId: string, itemId: string, newStock: number): Promise<void> => {
    try {
      await ShipService.updateInventoryStock(shipId, itemId, newStock);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          return {
            ...ship,
            inventory: ship.inventory.map(item =>
              item.id === itemId 
                ? { ...item, currentStock: newStock, lastStockUpdate: new Date(), updatedAt: new Date() }
                : item
            )
          };
        }
        return ship;
      }));
    } catch (err: any) {
      console.error('Error updating inventory stock:', err);
      setError(err.message || 'Failed to update inventory stock');
      throw err;
    }
  };

  const getShipInventory = async (shipId: string): Promise<InventoryItem[]> => {
    try {
      return await ShipService.getShipInventory(shipId);
    } catch (err: any) {
      console.error('Error getting ship inventory:', err);
      throw err;
    }
  };

  // Requisition Management
  const createRequisition = async (shipId: string, reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const reqId = await ShipService.createRequisition(shipId, reqData);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          const newReq = {
            ...reqData,
            id: reqId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return { ...ship, requisitions: [...ship.requisitions, newReq] };
        }
        return ship;
      }));

      await loadStats(); // Update stats for pending requisitions
      return reqId;
    } catch (err: any) {
      console.error('Error creating requisition:', err);
      setError(err.message || 'Failed to create requisition');
      throw err;
    }
  };

  const updateRequisitionStatus = async (shipId: string, reqId: string, status: Requisition['status'], approvedBy?: string): Promise<void> => {
    try {
      await ShipService.updateRequisitionStatus(shipId, reqId, status, approvedBy);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          return {
            ...ship,
            requisitions: ship.requisitions.map(req =>
              req.id === reqId 
                ? { 
                    ...req, 
                    status, 
                    approvedBy: status === 'approved' ? approvedBy : req.approvedBy,
                    approvalDate: status === 'approved' ? new Date() : req.approvalDate,
                    updatedAt: new Date() 
                  }
                : req
            )
          };
        }
        return ship;
      }));

      await loadStats(); // Update stats
    } catch (err: any) {
      console.error('Error updating requisition status:', err);
      setError(err.message || 'Failed to update requisition status');
      throw err;
    }
  };

  const getShipRequisitions = async (shipId: string): Promise<Requisition[]> => {
    try {
      return await ShipService.getShipRequisitions(shipId);
    } catch (err: any) {
      console.error('Error getting ship requisitions:', err);
      throw err;
    }
  };

  // Task Management
  const createTask = async (shipId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const taskId = await ShipService.createTask(shipId, taskData);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          const newTask = {
            ...taskData,
            id: taskId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return { ...ship, tasks: [...ship.tasks, newTask] };
        }
        return ship;
      }));

      await loadStats(); // Update stats for active tasks
      return taskId;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
      throw err;
    }
  };

  const updateTaskStatus = async (shipId: string, taskId: string, status: Task['status'], completionNotes?: string): Promise<void> => {
    try {
      await ShipService.updateTaskStatus(shipId, taskId, status, completionNotes);
      
      // Update local state
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          return {
            ...ship,
            tasks: ship.tasks.map(task =>
              task.id === taskId 
                ? { 
                    ...task, 
                    status, 
                    completedAt: status === 'completed' ? new Date() : task.completedAt,
                    completionNotes: completionNotes || task.completionNotes,
                    updatedAt: new Date() 
                  }
                : task
            )
          };
        }
        return ship;
      }));

      await loadStats(); // Update stats
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task status');
      throw err;
    }
  };

  const getShipTasks = async (shipId: string): Promise<Task[]> => {
    try {
      return await ShipService.getShipTasks(shipId);
    } catch (err: any) {
      console.error('Error getting ship tasks:', err);
      throw err;
    }
  };

  const contextValue: ShipContextType = {
    // State
    ships,
    currentShip,
    stats,
    isLoading,
    error,

    // Ship CRUD
    createShip,
    updateShip,
    deleteShip,
    setCurrentShip,
    refreshShips,

    // Crew Management
    addCrewMember,
    getShipCrew,

    // Certificate Management
    addCertificate,
    getShipCertificates,

    // Inventory Management
    addInventoryItem,
    updateInventoryStock,
    getShipInventory,

    // Requisition Management
    createRequisition,
    updateRequisitionStatus,
    getShipRequisitions,

    // Task Management
    createTask,
    updateTaskStatus,
    getShipTasks,

    // Utility functions
    getShipById,
    refreshStats,
  };

  return (
    <ShipContext.Provider value={contextValue}>
      {children}
    </ShipContext.Provider>
  );
}

export function useShips(): ShipContextType {
  const context = useContext(ShipContext);
  if (context === undefined) {
    throw new Error('useShips must be used within a ShipProvider');
  }
  return context;
}
