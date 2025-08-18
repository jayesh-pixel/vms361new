"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ShipService } from '@/lib/services/ship-service';
import { IAMFirestoreService } from '@/lib/iam/firestore';
import { IAMService } from '@/lib/iam/service';
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

  // Drawing Management
  addDrawing: (shipId: string, drawingData: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDrawing: (shipId: string, drawingId: string, updates: Partial<Drawing>) => Promise<void>;
  deleteDrawing: (shipId: string, drawingId: string) => Promise<void>;
  getShipDrawings: (shipId: string) => Promise<Drawing[]>;

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
  updateTaskStatus: (shipId: string, taskId: string, status: Task['status']) => Promise<void>;
  getShipTasks: (shipId: string) => Promise<Task[]>;

  // Utility functions
  getShipById: (id: string) => Ship | undefined;
  refreshStats: () => Promise<void>;

  // Permission functions
  canCreateShip: () => boolean;
  canUpdateShip: (shipId?: string) => boolean;
  canDeleteShip: (shipId?: string) => boolean;
  canManageCrew: (shipId?: string) => boolean;
  canManageInventory: (shipId?: string) => boolean;
  canCreateRequisition: (shipId?: string) => boolean;
  canCreateTask: (shipId?: string) => boolean;
}

const ShipContext = createContext<ShipContextType | undefined>(undefined);

export function useShips() {
  const context = useContext(ShipContext);
  if (context === undefined) {
    throw new Error('useShips must be used within a ShipProvider');
  }
  return context;
}

export function ShipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ships, setShips] = useState<Ship[]>([]);
  const [currentShip, setCurrentShip] = useState<Ship | null>(null);
  const [stats, setStats] = useState<ShipStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);

  // Load user permissions when user changes
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user?.uid) {
        setUserPermissions(null);
        return;
      }

      try {
        const userData = await IAMFirestoreService.getUserByUID(user.uid);
        console.log('Loaded user data:', userData);
        setUserPermissions(userData);
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setUserPermissions(null);
      }
    };

    loadUserPermissions();
  }, [user]);

  useEffect(() => {
    if (user && userPermissions?.companyId) {
      refreshShips();
      refreshStats();
    } else if (!user) {
      setShips([]);
      setCurrentShip(null);
      setStats(null);
      setUserPermissions(null);
    }
  }, [user, userPermissions]);

  const createShip = async (shipData: CreateShipRequest & { image?: File | null }): Promise<string> => {
    try {
      setError(null);
      setIsLoading(true);

      // Check permissions
      if (!user?.uid || !userPermissions) {
        throw new Error('Authentication required');
      }

      const canCreate = IAMService.hasPermission(userPermissions, 'create', 'ship_profile').allowed;
      if (!canCreate) {
        throw new Error('Insufficient permissions to create ships');
      }

      const shipId = await ShipService.createShip(shipData, userPermissions.companyId, user.uid);
      
      // Refresh ships list
      await refreshShips();
      
      return shipId;
    } catch (err: any) {
      console.error('Error creating ship:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShip = async (id: string, updates: UpdateShipRequest): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Check permissions
      if (!user?.uid || !userPermissions) {
        throw new Error('Authentication required');
      }

      const canUpdate = IAMService.hasPermission(userPermissions, 'update', 'ship_profile').allowed;
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update ships');
      }

      await ShipService.updateShip(id, updates);
      
      // Update local state
      setShips(prev => prev.map(ship =>
        ship.id === id ? { ...ship, ...updates, updatedAt: new Date() } : ship
      ));

      // Update current ship if it's the one being updated
      if (currentShip?.id === id) {
        setCurrentShip(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (err: any) {
      console.error('Error updating ship:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShip = async (id: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Check permissions
      if (!user?.uid || !userPermissions) {
        throw new Error('Authentication required');
      }

      const canDelete = IAMService.hasPermission(userPermissions, 'delete', 'ship_profile').allowed;
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete ships');
      }

      await ShipService.deleteShip(id);
      
      // Update local state
      setShips(prev => prev.filter(ship => ship.id !== id));
      
      // Clear current ship if it's the one being deleted
      if (currentShip?.id === id) {
        setCurrentShip(null);
      }
    } catch (err: any) {
      console.error('Error deleting ship:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setShipAsCurrent = (ship: Ship | null) => {
    setCurrentShip(ship);
  };

  const refreshShips = async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!userPermissions?.companyId) {
        console.log('Cannot load ships: No company ID in userPermissions:', userPermissions);
        setShips([]);
        return;
      }
      
      console.log('Loading ships for company:', userPermissions.companyId);
      const shipsList = await ShipService.getShipsByCompany(userPermissions.companyId);
      console.log('Loaded ships:', shipsList.length, shipsList);
      setShips(shipsList);
    } catch (err: any) {
      console.error('Error loading ships:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getShipById = (id: string): Ship | undefined => {
    return ships.find(ship => ship.id === id);
  };

  const refreshStats = async (): Promise<void> => {
    try {
      setError(null);
      
      if (!userPermissions?.companyId) {
        setStats(null);
        return;
      }
      
      const statsData = await ShipService.getCompanyShipStats(userPermissions.companyId);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading ship stats:', err);
      setError(err.message);
    }
  };

  const addCrewMember = async (shipId: string, crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);
      const crewId = await ShipService.addCrewMember(shipId, crewData);
      
      // Create a clean crew object for local state update without undefined values
      const cleanCrewData: CrewMember = {
        id: crewId,
        name: crewData.name,
        rank: crewData.rank,
        nationality: crewData.nationality,
        joinDate: crewData.joinDate instanceof Date ? crewData.joinDate : new Date(crewData.joinDate || new Date()),
        certificates: crewData.certificates || [],
        contact: crewData.contact || { email: '', phone: '', emergencyContact: '' },
        status: crewData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Only add optional fields if they exist
        ...(crewData.contractEndDate && { contractEndDate: crewData.contractEndDate }),
        ...(crewData.salary && { salary: crewData.salary }),
        ...(crewData.currency && { currency: crewData.currency }),
        ...(crewData.jobType && { jobType: crewData.jobType }),
      };
      
      // Update ships list to reflect new crew member count
      setShips(prev => prev.map(ship => {
        if (ship.id === shipId) {
          return {
            ...ship,
            crew: [...ship.crew, cleanCrewData]
          };
        }
        return ship;
      }));

      return crewId;
    } catch (err: any) {
      console.error('Error adding crew member:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipCrew = async (shipId: string): Promise<CrewMember[]> => {
    try {
      setError(null);
      return await ShipService.getShipCrew(shipId);
    } catch (err: any) {
      console.error('Error getting ship crew:', err);
      setError(err.message);
      throw err;
    }
  };

  const addCertificate = async (shipId: string, certData: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
    try {
      setError(null);
      return await ShipService.addCertificate(shipId, certData);
    } catch (err: any) {
      console.error('Error adding certificate:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipCertificates = async (shipId: string): Promise<Certificate[]> => {
    try {
      setError(null);
      return await ShipService.getShipCertificates(shipId);
    } catch (err: any) {
      console.error('Error getting ship certificates:', err);
      setError(err.message);
      throw err;
    }
  };

  const addDrawing = async (shipId: string, drawingData: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);
      return await ShipService.addDrawing(shipId, drawingData);
    } catch (err: any) {
      console.error('Error adding drawing:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateDrawing = async (shipId: string, drawingId: string, updates: Partial<Drawing>): Promise<void> => {
    try {
      setError(null);
      await ShipService.updateDrawing(shipId, drawingId, updates);
    } catch (err: any) {
      console.error('Error updating drawing:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteDrawing = async (shipId: string, drawingId: string): Promise<void> => {
    try {
      setError(null);
      await ShipService.deleteDrawing(shipId, drawingId);
    } catch (err: any) {
      console.error('Error deleting drawing:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipDrawings = async (shipId: string): Promise<Drawing[]> => {
    try {
      setError(null);
      return await ShipService.getShipDrawings(shipId);
    } catch (err: any) {
      console.error('Error getting ship drawings:', err);
      setError(err.message);
      throw err;
    }
  };

  const addInventoryItem = async (shipId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);
      return await ShipService.addInventoryItem(shipId, itemData);
    } catch (err: any) {
      console.error('Error adding inventory item:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateInventoryStock = async (shipId: string, itemId: string, newStock: number): Promise<void> => {
    try {
      setError(null);
      await ShipService.updateInventoryStock(shipId, itemId, newStock);
    } catch (err: any) {
      console.error('Error updating inventory stock:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipInventory = async (shipId: string): Promise<InventoryItem[]> => {
    try {
      setError(null);
      return await ShipService.getShipInventory(shipId);
    } catch (err: any) {
      console.error('Error getting ship inventory:', err);
      setError(err.message);
      throw err;
    }
  };

  const createRequisition = async (shipId: string, reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);

      // Check permissions
      if (!user?.uid || !userPermissions) {
        throw new Error('Authentication required');
      }

      const canCreate = IAMService.hasPermission(userPermissions, 'create', 'requisition').allowed;
      if (!canCreate) {
        throw new Error('Insufficient permissions to create requisitions');
      }

      return await ShipService.createRequisition(shipId, reqData);
    } catch (err: any) {
      console.error('Error creating requisition:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateRequisitionStatus = async (shipId: string, reqId: string, status: Requisition['status'], approvedBy?: string): Promise<void> => {
    try {
      setError(null);
      await ShipService.updateRequisitionStatus(shipId, reqId, status, approvedBy);
    } catch (err: any) {
      console.error('Error updating requisition status:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipRequisitions = async (shipId: string): Promise<Requisition[]> => {
    try {
      setError(null);
      return await ShipService.getShipRequisitions(shipId);
    } catch (err: any) {
      console.error('Error getting ship requisitions:', err);
      setError(err.message);
      throw err;
    }
  };

  const createTask = async (shipId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);

      // Check permissions
      if (!user?.uid || !userPermissions) {
        throw new Error('Authentication required');
      }

      const canCreate = IAMService.hasPermission(userPermissions, 'create', 'task').allowed;
      if (!canCreate) {
        throw new Error('Insufficient permissions to create tasks');
      }

      return await ShipService.createTask(shipId, taskData);
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateTaskStatus = async (shipId: string, taskId: string, status: Task['status']): Promise<void> => {
    try {
      setError(null);
      await ShipService.updateTaskStatus(shipId, taskId, status);
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setError(err.message);
      throw err;
    }
  };

  const getShipTasks = async (shipId: string): Promise<Task[]> => {
    try {
      setError(null);
      return await ShipService.getShipTasks(shipId);
    } catch (err: any) {
      console.error('Error getting ship tasks:', err);
      setError(err.message);
      throw err;
    }
  };

  const canCreateShip = (): boolean => {
    if (!user || !userPermissions) return false;
    try {
      // For synchronous permission checking, we check role
      const role = userPermissions.companyRole;
      return role === 'owner' || role === 'admin' || role === 'procurement';
    } catch {
      return false;
    }
  };

  const canUpdateShip = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin' || role === 'procurement';
  };

  const canDeleteShip = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin';
  };

  const canManageCrew = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin' || role === 'hr';
  };

  const canManageInventory = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin' || role === 'procurement';
  };

  const canCreateRequisition = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin' || role === 'procurement' || role === 'finance';
  };

  const canCreateTask = (shipId?: string): boolean => {
    if (!user || !userPermissions) return false;
    const role = userPermissions.companyRole;
    return role === 'owner' || role === 'admin';
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
    setCurrentShip: setShipAsCurrent,
    refreshShips,

    // Crew Management
    addCrewMember,
    getShipCrew,

    // Certificate Management
    addCertificate,
    getShipCertificates,

    // Drawing Management
    addDrawing,
    updateDrawing,
    deleteDrawing,
    getShipDrawings,

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

    // Permission functions
    canCreateShip,
    canUpdateShip,
    canDeleteShip,
    canManageCrew,
    canManageInventory,
    canCreateRequisition,
    canCreateTask
  };

  return (
    <ShipContext.Provider value={contextValue}>
      {children}
    </ShipContext.Provider>
  );
}
