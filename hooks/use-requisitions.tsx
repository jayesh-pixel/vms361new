"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { RequisitionService } from '@/lib/services/requisition-service'
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
} from '@/lib/types/requisition'

interface RequisitionContextType {
  // State
  requisitions: ExtendedRequisition[]
  shipRequisitions: any[]
  purchaseOrders: PurchaseOrder[]
  workOrders: WorkOrder[]
  vendors: Vendor[]
  vendorQuotes: VendorQuote[]
  auditReports: AuditReport[]
  legalDocuments: LegalDocument[]
  stats: {
    requisition: RequisitionStats | null
    purchaseOrder: PurchaseOrderStats | null
    workOrder: WorkOrderStats | null
    vendor: VendorStats | null
  }
  loading: boolean
  error: string | null

  // Requisition Management
  createRequisition: (reqData: Omit<ExtendedRequisition, 'id' | 'createdAt' | 'updatedAt' | 'prNumber'>) => Promise<string>
  updateRequisition: (id: string, updates: Partial<ExtendedRequisition>) => Promise<void>
  deleteRequisition: (id: string) => Promise<void>
  getRequisitionById: (id: string) => Promise<ExtendedRequisition | null>
  loadRequisitions: (filters?: any) => Promise<void>
  loadAllShipRequisitions: () => Promise<void>

  // Purchase Order Management
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'poNumber'>) => Promise<string>
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>
  loadPurchaseOrders: (filters?: any) => Promise<void>

  // Work Order Management
  createWorkOrder: (woData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'woNumber'>) => Promise<string>
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>
  loadWorkOrders: (filters?: any) => Promise<void>

  // Vendor Management
  createVendor: (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'vendorId' | 'totalOrders' | 'onTimeDeliveryRate' | 'qualityRating'>) => Promise<string>
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>
  loadVendors: (filters?: any) => Promise<void>

  // Vendor Quote Management
  createVendorQuote: (quoteData: Omit<VendorQuote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  loadVendorQuotes: (requisitionId: string) => Promise<void>

  // Audit Report Management
  createAuditReport: (auditData: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt' | 'auditNumber'>) => Promise<string>
  updateAuditReport: (id: string, updates: Partial<AuditReport>) => Promise<void>
  loadAuditReports: (filters?: any) => Promise<void>

  // Legal Document Management
  createLegalDocument: (docData: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateLegalDocument: (id: string, updates: Partial<LegalDocument>) => Promise<void>
  loadLegalDocuments: (filters?: any) => Promise<void>

  // Statistics
  loadStats: () => Promise<void>

  // Permission checks
  canCreateRequisition: () => boolean
  canApproveRequisition: () => boolean
  canCreatePurchaseOrder: () => boolean
  canManageVendors: () => boolean
  canViewAuditReports: () => boolean
  canManageLegalDocuments: () => boolean
}

const RequisitionContext = createContext<RequisitionContextType | undefined>(undefined)

interface RequisitionProviderProps {
  children: ReactNode
}

export function RequisitionProvider({ children }: RequisitionProviderProps) {
  const { user } = useAuth()
  const { userPermissions } = usePermissions()

  // State
  const [requisitions, setRequisitions] = useState<ExtendedRequisition[]>([])
  const [shipRequisitions, setShipRequisitions] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>([])
  const [auditReports, setAuditReports] = useState<AuditReport[]>([])
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([])
  const [stats, setStats] = useState<{
    requisition: RequisitionStats | null
    purchaseOrder: PurchaseOrderStats | null
    workOrder: WorkOrderStats | null
    vendor: VendorStats | null
  }>({
    requisition: null,
    purchaseOrder: null,
    workOrder: null,
    vendor: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============ REQUISITION MANAGEMENT ============

  const createRequisition = async (reqData: Omit<ExtendedRequisition, 'id' | 'createdAt' | 'updatedAt' | 'prNumber'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const reqId = await RequisitionService.createRequisition({
        ...reqData,
        companyId: userPermissions.companyId,
        requestedBy: user.uid
      })

      // Reload requisitions
      await loadRequisitions()
      await loadStats()
      
      return reqId
    } catch (err: any) {
      console.error('Error creating requisition:', err)
      setError(err.message)
      throw err
    }
  }

  const updateRequisition = async (id: string, updates: Partial<ExtendedRequisition>): Promise<void> => {
    try {
      setError(null)
      await RequisitionService.updateRequisition(id, updates)
      
      // Update local state
      setRequisitions(prev => prev.map(req => 
        req.id === id ? { ...req, ...updates, updatedAt: new Date() } : req
      ))
    } catch (err: any) {
      console.error('Error updating requisition:', err)
      setError(err.message)
      throw err
    }
  }

  const deleteRequisition = async (id: string): Promise<void> => {
    try {
      setError(null)
      await RequisitionService.deleteRequisition(id)
      
      // Update local state
      setRequisitions(prev => prev.filter(req => req.id !== id))
    } catch (err: any) {
      console.error('Error deleting requisition:', err)
      setError(err.message)
      throw err
    }
  }

  const getRequisitionById = async (id: string): Promise<ExtendedRequisition | null> => {
    try {
      setError(null)
      return await RequisitionService.getRequisitionById(id)
    } catch (err: any) {
      console.error('Error getting requisition:', err)
      setError(err.message)
      throw err
    }
  }

  const loadRequisitions = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      console.log('loadRequisitions called with:', { userPermissions, filters })
      
      if (!userPermissions?.companyId) {
        console.log('No company ID available, skipping load')
        return
      }

      console.log('Loading requisitions for company:', userPermissions.companyId)
      setLoading(true)
      
      const requisitionsList = await RequisitionService.getRequisitionsByCompany(
        userPermissions.companyId,
        filters
      )
      
      console.log('Loaded requisitions:', requisitionsList)
      setRequisitions(requisitionsList)
    } catch (err: any) {
      console.error('Error loading requisitions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAllShipRequisitions = async (): Promise<void> => {
    try {
      setError(null)
      console.log('loadAllShipRequisitions called')
      
      if (!userPermissions?.companyId) {
        console.log('No company ID available, skipping ship requisitions load')
        return
      }

      console.log('Loading ship requisitions for company:', userPermissions.companyId)
      setLoading(true)
      
      // Import ShipService
      const { ShipService } = await import('@/lib/services/ship-service')
      
      // Get all ships for the company
      const ships = await ShipService.getShipsByCompany(userPermissions.companyId)
      console.log('Found ships:', ships.length)
      
      // Get requisitions for all ships
      const allShipRequisitions: any[] = []
      for (const ship of ships) {
        try {
          const shipReqs = await ShipService.getShipRequisitions(ship.id)
          // Add ship info to each requisition
          const enrichedReqs = shipReqs.map(req => ({
            ...req,
            shipId: ship.id,
            shipName: ship.name,
            shipIMO: ship.imo,
            source: 'ship'
          }))
          allShipRequisitions.push(...enrichedReqs)
          console.log(`Loaded ${shipReqs.length} requisitions for ship ${ship.name}`)
        } catch (shipError) {
          console.error(`Error loading requisitions for ship ${ship.id}:`, shipError)
        }
      }
      
      console.log('Total ship requisitions loaded:', allShipRequisitions.length)
      setShipRequisitions(allShipRequisitions)
    } catch (err: any) {
      console.error('Error loading ship requisitions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ PURCHASE ORDER MANAGEMENT ============

  const createPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'poNumber'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const poId = await RequisitionService.createPurchaseOrder({
        ...poData,
        companyId: userPermissions.companyId,
        createdBy: user.uid
      })

      await loadPurchaseOrders()
      return poId
    } catch (err: any) {
      console.error('Error creating purchase order:', err)
      setError(err.message)
      throw err
    }
  }

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>): Promise<void> => {
    try {
      setError(null)
      // Implementation for updating purchase order
      // Note: This would need to be added to RequisitionService
      
      setPurchaseOrders(prev => prev.map(po => 
        po.id === id ? { ...po, ...updates, updatedAt: new Date() } : po
      ))
    } catch (err: any) {
      console.error('Error updating purchase order:', err)
      setError(err.message)
      throw err
    }
  }

  const loadPurchaseOrders = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      setLoading(true)
      const poList = await RequisitionService.getPurchaseOrdersByCompany(
        userPermissions.companyId,
        filters
      )
      setPurchaseOrders(poList)
    } catch (err: any) {
      console.error('Error loading purchase orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ WORK ORDER MANAGEMENT ============

  const createWorkOrder = async (woData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'woNumber'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const woId = await RequisitionService.createWorkOrder({
        ...woData,
        companyId: userPermissions.companyId,
        createdBy: user.uid
      })

      await loadWorkOrders()
      return woId
    } catch (err: any) {
      console.error('Error creating work order:', err)
      setError(err.message)
      throw err
    }
  }

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>): Promise<void> => {
    try {
      setError(null)
      // Implementation for updating work order
      
      setWorkOrders(prev => prev.map(wo => 
        wo.id === id ? { ...wo, ...updates, updatedAt: new Date() } : wo
      ))
    } catch (err: any) {
      console.error('Error updating work order:', err)
      setError(err.message)
      throw err
    }
  }

  const loadWorkOrders = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      setLoading(true)
      const woList = await RequisitionService.getWorkOrdersByCompany(
        userPermissions.companyId,
        filters
      )
      setWorkOrders(woList)
    } catch (err: any) {
      console.error('Error loading work orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ VENDOR MANAGEMENT ============

  const createVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'vendorId' | 'totalOrders' | 'onTimeDeliveryRate' | 'qualityRating'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const vendorId = await RequisitionService.createVendor({
        ...vendorData,
        companyId: userPermissions.companyId,
        createdBy: user.uid
      })

      await loadVendors()
      return vendorId
    } catch (err: any) {
      console.error('Error creating vendor:', err)
      setError(err.message)
      throw err
    }
  }

  const updateVendor = async (id: string, updates: Partial<Vendor>): Promise<void> => {
    try {
      setError(null)
      // Implementation for updating vendor
      
      setVendors(prev => prev.map(vendor => 
        vendor.id === id ? { ...vendor, ...updates, updatedAt: new Date() } : vendor
      ))
    } catch (err: any) {
      console.error('Error updating vendor:', err)
      setError(err.message)
      throw err
    }
  }

  const loadVendors = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      setLoading(true)
      const vendorsList = await RequisitionService.getVendorsByCompany(
        userPermissions.companyId,
        filters
      )
      setVendors(vendorsList)
    } catch (err: any) {
      console.error('Error loading vendors:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ VENDOR QUOTE MANAGEMENT ============

  const createVendorQuote = async (quoteData: Omit<VendorQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null)
      const quoteId = await RequisitionService.createVendorQuote(quoteData)
      return quoteId
    } catch (err: any) {
      console.error('Error creating vendor quote:', err)
      setError(err.message)
      throw err
    }
  }

  const loadVendorQuotes = async (requisitionId: string): Promise<void> => {
    try {
      setError(null)
      const quotes = await RequisitionService.getQuotesByRequisition(requisitionId)
      setVendorQuotes(quotes)
    } catch (err: any) {
      console.error('Error loading vendor quotes:', err)
      setError(err.message)
    }
  }

  // ============ AUDIT REPORT MANAGEMENT ============

  const createAuditReport = async (auditData: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt' | 'auditNumber'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const auditId = await RequisitionService.createAuditReport({
        ...auditData,
        companyId: userPermissions.companyId,
        createdBy: user.uid
      })

      await loadAuditReports()
      return auditId
    } catch (err: any) {
      console.error('Error creating audit report:', err)
      setError(err.message)
      throw err
    }
  }

  const updateAuditReport = async (id: string, updates: Partial<AuditReport>): Promise<void> => {
    try {
      setError(null)
      // Implementation for updating audit report
      
      setAuditReports(prev => prev.map(audit => 
        audit.id === id ? { ...audit, ...updates, updatedAt: new Date() } : audit
      ))
    } catch (err: any) {
      console.error('Error updating audit report:', err)
      setError(err.message)
      throw err
    }
  }

  const loadAuditReports = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      setLoading(true)
      const auditsList = await RequisitionService.getAuditReportsByCompany(
        userPermissions.companyId,
        filters
      )
      setAuditReports(auditsList)
    } catch (err: any) {
      console.error('Error loading audit reports:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ LEGAL DOCUMENT MANAGEMENT ============

  const createLegalDocument = async (docData: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null)
      if (!user?.uid || !userPermissions?.companyId) {
        throw new Error('Authentication required')
      }

      const docId = await RequisitionService.createLegalDocument({
        ...docData,
        companyId: userPermissions.companyId,
        createdBy: user.uid
      })

      await loadLegalDocuments()
      return docId
    } catch (err: any) {
      console.error('Error creating legal document:', err)
      setError(err.message)
      throw err
    }
  }

  const updateLegalDocument = async (id: string, updates: Partial<LegalDocument>): Promise<void> => {
    try {
      setError(null)
      // Implementation for updating legal document
      
      setLegalDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date() } : doc
      ))
    } catch (err: any) {
      console.error('Error updating legal document:', err)
      setError(err.message)
      throw err
    }
  }

  const loadLegalDocuments = async (filters?: any): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      setLoading(true)
      const docsList = await RequisitionService.getLegalDocumentsByCompany(
        userPermissions.companyId,
        filters
      )
      setLegalDocuments(docsList)
    } catch (err: any) {
      console.error('Error loading legal documents:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============ STATISTICS ============

  const loadStats = async (): Promise<void> => {
    try {
      setError(null)
      if (!userPermissions?.companyId) return

      const requisitionStats = await RequisitionService.getRequisitionStats(userPermissions.companyId)
      setStats(prev => ({ ...prev, requisition: requisitionStats }))
    } catch (err: any) {
      console.error('Error loading stats:', err)
      setError(err.message)
    }
  }

  // ============ PERMISSION CHECKS ============

  const canCreateRequisition = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'procurement' || role === 'finance'
  }

  const canApproveRequisition = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'finance'
  }

  const canCreatePurchaseOrder = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'procurement'
  }

  const canManageVendors = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'procurement'
  }

  const canViewAuditReports = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'hr'
  }

  const canManageLegalDocuments = (): boolean => {
    if (!user || !userPermissions) return false
    const role = userPermissions.companyRole
    return role === 'owner' || role === 'admin' || role === 'hr'
  }

  // Load initial data
  useEffect(() => {
    if (userPermissions?.companyId) {
      loadRequisitions()
      loadAllShipRequisitions()
      loadVendors()
      loadStats()
    }
  }, [userPermissions?.companyId])

  const contextValue: RequisitionContextType = {
    // State
    requisitions,
    shipRequisitions,
    purchaseOrders,
    workOrders,
    vendors,
    vendorQuotes,
    auditReports,
    legalDocuments,
    stats,
    loading,
    error,

    // Requisition Management
    createRequisition,
    updateRequisition,
    deleteRequisition,
    getRequisitionById,
    loadRequisitions,
    loadAllShipRequisitions,

    // Purchase Order Management
    createPurchaseOrder,
    updatePurchaseOrder,
    loadPurchaseOrders,

    // Work Order Management
    createWorkOrder,
    updateWorkOrder,
    loadWorkOrders,

    // Vendor Management
    createVendor,
    updateVendor,
    loadVendors,

    // Vendor Quote Management
    createVendorQuote,
    loadVendorQuotes,

    // Audit Report Management
    createAuditReport,
    updateAuditReport,
    loadAuditReports,

    // Legal Document Management
    createLegalDocument,
    updateLegalDocument,
    loadLegalDocuments,

    // Statistics
    loadStats,

    // Permission checks
    canCreateRequisition,
    canApproveRequisition,
    canCreatePurchaseOrder,
    canManageVendors,
    canViewAuditReports,
    canManageLegalDocuments,
  }

  return (
    <RequisitionContext.Provider value={contextValue}>
      {children}
    </RequisitionContext.Provider>
  )
}

export function useRequisitions() {
  const context = useContext(RequisitionContext)
  if (context === undefined) {
    throw new Error('useRequisitions must be used within a RequisitionProvider')
  }
  return context
}
