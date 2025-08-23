import { useState, useEffect } from 'react';
import { InventoryService, InventoryItem, InventoryStats, CreateInventoryItemRequest, UpdateInventoryItemRequest, StockMovement } from '@/lib/services/inventory-service';
import { useToast } from '@/hooks/use-toast';

export function useInventory(shipId?: string) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let inventoryItems: InventoryItem[];
      if (shipId) {
        inventoryItems = await InventoryService.getShipInventory(shipId);
      } else {
        inventoryItems = await InventoryService.getAllInventory();
      }
      
      setItems(inventoryItems);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to fetch inventory items');
      toast({
        title: "Error",
        description: "Failed to fetch inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory statistics
  const fetchStats = async () => {
    try {
      const inventoryStats = await InventoryService.getInventoryStats(shipId);
      setStats(inventoryStats);
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
      toast({
        title: "Error",
        description: "Failed to fetch inventory statistics",
        variant: "destructive",
      });
    }
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    try {
      const lowStock = await InventoryService.getLowStockItems(shipId);
      setLowStockItems(lowStock);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      toast({
        title: "Error",
        description: "Failed to fetch low stock items",
        variant: "destructive",
      });
    }
  };

  // Create inventory item
  const createItem = async (itemData: CreateInventoryItemRequest) => {
    try {
      const itemId = await InventoryService.createInventoryItem(itemData);
      await fetchInventory();
      await fetchStats();
      await fetchLowStockItems();
      
      toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
      
      return itemId;
    } catch (err) {
      console.error('Error creating inventory item:', err);
      toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update inventory item
  const updateItem = async (itemId: string, updates: UpdateInventoryItemRequest) => {
    try {
      await InventoryService.updateInventoryItem(itemId, updates);
      await fetchInventory();
      await fetchStats();
      await fetchLowStockItems();
      
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    } catch (err) {
      console.error('Error updating inventory item:', err);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Delete inventory item
  const deleteItem = async (itemId: string) => {
    try {
      await InventoryService.deleteInventoryItem(itemId);
      await fetchInventory();
      await fetchStats();
      await fetchLowStockItems();
      
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update stock
  const updateStock = async (
    itemId: string,
    quantityChange: number,
    type: 'in' | 'out' | 'adjustment' | 'transfer',
    reason: string,
    reference?: string
  ) => {
    try {
      await InventoryService.updateStock(itemId, quantityChange, type, reason, reference);
      await fetchInventory();
      await fetchStats();
      await fetchLowStockItems();
      
      toast({
        title: "Success",
        description: `Stock ${type === 'in' ? 'added' : type === 'out' ? 'removed' : 'adjusted'} successfully`,
      });
    } catch (err) {
      console.error('Error updating stock:', err);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Search inventory
  const searchItems = async (searchTerm: string) => {
    try {
      setLoading(true);
      const searchResults = await InventoryService.searchInventory(searchTerm, shipId);
      setItems(searchResults);
    } catch (err) {
      console.error('Error searching inventory:', err);
      toast({
        title: "Error",
        description: "Failed to search inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get stock movements for an item
  const getStockMovements = async (itemId: string): Promise<StockMovement[]> => {
    try {
      return await InventoryService.getStockMovements(itemId);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      toast({
        title: "Error",
        description: "Failed to fetch stock movements",
        variant: "destructive",
      });
      return [];
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchInventory();
    fetchStats();
    fetchLowStockItems();
  }, [shipId]);

  return {
    items,
    stats,
    lowStockItems,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    updateStock,
    searchItems,
    getStockMovements,
    refetch: () => {
      fetchInventory();
      fetchStats();
      fetchLowStockItems();
    },
  };
}
