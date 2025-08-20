// Extended Requisition and Purchase Management Types

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'sent_to_vendor' | 'acknowledged' | 'partially_delivered' | 'completed' | 'cancelled';
export type WorkOrderStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type WorkOrderType = 'maintenance' | 'repair' | 'inspection' | 'installation' | 'modification' | 'emergency';
export type VendorStatus = 'active' | 'inactive' | 'blacklisted' | 'pending_approval';
export type VendorCategory = 'marine_equipment' | 'engineering' | 'safety' | 'navigation' | 'catering' | 'cleaning' | 'spare_parts' | 'fuel' | 'lubricants' | 'services' | 'other';
export type AuditType = 'internal' | 'external' | 'regulatory' | 'compliance' | 'financial';
export type AuditStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

// Vendor Management
export interface Vendor {
  id: string;
  name: string;
  vendorId: string; // Unique vendor identifier
  category: VendorCategory;
  status: VendorStatus;
  
  // Contact Information
  contact: {
    primaryContact: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    fax?: string;
    website?: string;
  };
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  // Business Information
  business: {
    registrationNumber: string;
    taxId: string;
    vatNumber?: string;
    bankAccount?: string;
    bankName?: string;
    swiftCode?: string;
  };
  
  // Capabilities and Certifications
  certifications: string[];
  capabilities: string[];
  servicesOffered: string[];
  
  // Performance Metrics
  rating: number; // 1-5 star rating
  totalOrders: number;
  onTimeDeliveryRate: number; // Percentage
  qualityRating: number; // 1-5
  
  // Financial Information
  creditLimit?: number;
  paymentTerms: string; // e.g., "Net 30", "COD"
  currency: string;
  
  // Compliance and Legal
  insuranceCertificate?: string;
  complianceDocuments: string[];
  blacklistReason?: string;
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Requisition Type
export type RequisitionType = 'purchase' | 'service' | 'work' | 'transfer' | 'other';

// Extended Requisition with more fields
export interface ExtendedRequisition {
  id: string;
  prNumber: string; // PR Number (Auto-generated)
  
  // New fields for enhanced requisition
  reqsnNumber?: string; // New requisition number format (TROY-SOT-V250024)
  catalogue?: string; // Miscellaneous, Engine Spares, etc.
  model?: string; // Equipment model
  dateSent?: Date; // Date when requisition was sent
  deliveryDate?: Date; // Expected delivery date
  deliveryPort?: string; // Port for delivery
  currentStatus?: string; // New status field
  vesselRemarks?: string; // Free-text remarks
  createdDate?: Date; // Created date
  maintenanceType?: string; // Regular Maintenance or Breakdown
  sparesChecked?: string; // Yes/No for spares check
  machineryEquipment?: string; // Related machinery/equipment
  requisitionType?: string; // Piece-Meal, Bulk Order, etc.
  
  // Original fields
  type: RequisitionType;
  title: string;
  description?: string;
  
  // Request Information
  requestedBy: string; // User ID
  requestDate: Date;
  requiredDate: Date;
  department: string;
  shipId?: string; // If ship-specific
  
  // Status and Approval
  status: RequisitionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approvalWorkflow: ApprovalStep[];
  
  // Items and Costs
  items: ExtendedRequisitionItem[];
  totalCost: number;
  currency: string;
  
  // Vendor Information
  suggestedVendors: string[]; // Vendor IDs
  selectedVendor?: string; // Vendor ID
  quotes: VendorQuote[];
  
  // Purchase Order Reference
  purchaseOrderId?: string;
  
  // Notes and Attachments
  notes?: string;
  attachments: string[]; // File URLs
  internalNotes?: string;
  
  // Legal and Compliance
  budgetCode?: string;
  projectCode?: string;
  costCenter?: string;
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedRequisitionItem {
  id: string;
  itemNumber: string; // Item line number
  partNumber?: string;
  name: string;
  description: string;
  specification?: string;
  
  // Quantity and Pricing
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  
  // Vendor and Sourcing
  preferredVendor?: string; // Vendor ID
  alternateVendors: string[]; // Vendor IDs
  lastPurchasePrice?: number;
  
  // Technical Details
  manufacturer?: string;
  model?: string;
  grade?: string;
  material?: string;
  
  // Delivery and Location
  deliveryLocation?: string;
  urgencyLevel: 'standard' | 'urgent' | 'emergency';
  
  // Approval Status
  approved: boolean;
  approvedQuantity?: number;
  rejectionReason?: string;
}

// Vendor Quotes
export interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  quoteNumber: string;
  quoteDate: Date;
  validUntil: Date;
  
  // Pricing
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  
  // Terms
  paymentTerms: string;
  deliveryTerms: string;
  deliveryTime: number; // Days
  
  // Status
  isSelected: boolean;
  status: 'pending' | 'submitted' | 'selected' | 'rejected' | 'expired';
  
  // Attachments
  attachments: string[]; // Quote documents
  
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  requisitionItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryTime?: number; // Days
  notes?: string;
}

// Purchase Order
export interface PurchaseOrder {
  id: string;
  poNumber: string; // Auto-generated PO number
  requisitionId: string;
  
  // Vendor Information
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  
  // Order Details
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  
  // Items
  items: PurchaseOrderItem[];
  
  // Financial
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  
  // Terms and Conditions
  paymentTerms: string;
  deliveryTerms: string;
  shippingAddress: string;
  billingAddress: string;
  
  // Status and Tracking
  status: PurchaseOrderStatus;
  trackingNumber?: string;
  
  // Approval
  approvedBy: string; // User ID
  approvalDate: Date;
  
  // Delivery and Receipt
  deliveryNotes?: string;
  receivedBy?: string; // User ID
  receivedDate?: Date;
  partialDeliveries: PartialDelivery[];
  
  // Legal
  contractReference?: string;
  specialInstructions?: string;
  
  // Metadata
  companyId: string;
  shipId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PurchaseOrderItem {
  id: string;
  requisitionItemId: string;
  description: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Delivery Status
  quantityReceived: number;
  quantityPending: number;
  
  // Quality Control
  inspectionRequired: boolean;
  inspectionStatus?: 'pending' | 'passed' | 'failed';
  qualityNotes?: string;
}

export interface PartialDelivery {
  id: string;
  deliveryDate: Date;
  items: {
    itemId: string;
    quantityDelivered: number;
    condition: 'good' | 'damaged' | 'defective';
    notes?: string;
  }[];
  receivedBy: string; // User ID
  deliveryNote?: string;
  attachments?: string[];
}

// Work Order
export interface WorkOrder {
  id: string;
  woNumber: string; // Work Order Number
  type: WorkOrderType;
  title: string;
  description: string;
  
  // Assignment
  assignedTo: string[]; // User IDs or external contractor IDs
  assignedBy: string; // User ID
  
  // Scheduling
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Location and Asset
  shipId?: string;
  location: string; // Specific location on ship or facility
  assetId?: string; // Equipment/system ID
  
  // Priority and Status
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: WorkOrderStatus;
  
  // Resources
  requiredSkills: string[];
  estimatedHours: number;
  actualHours?: number;
  requiredTools: string[];
  safetyRequirements: string[];
  
  // Materials and Costs
  requiredMaterials: WorkOrderMaterial[];
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;
  
  // Related Documents
  procedures: string[]; // Procedure document references
  drawings: string[]; // Technical drawing references
  permits: string[]; // Required permits/certifications
  
  // Progress and Completion
  progressNotes: WorkOrderProgress[];
  completionNotes?: string;
  qualityCheck?: boolean;
  clientSignoff?: boolean;
  
  // Requisition Link
  requisitionId?: string;
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkOrderMaterial {
  id: string;
  name: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  estimatedCost?: number;
  actualCost?: number;
  source: 'inventory' | 'purchase' | 'rental';
  inventoryItemId?: string;
  requisitionItemId?: string;
}

export interface WorkOrderProgress {
  id: string;
  date: Date;
  description: string;
  hoursWorked: number;
  workPerformed: string;
  issues?: string;
  nextSteps?: string;
  completionPercentage: number;
  recordedBy: string; // User ID
  attachments?: string[];
}

// Approval Workflow
export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: string; // Role required for approval
  approverId?: string; // User ID who approved
  approvalDate?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments?: string;
  delegatedTo?: string; // User ID if delegated
}

// Audit Reports
export interface AuditReport {
  id: string;
  auditNumber: string; // Auto-generated audit number
  title: string;
  type: AuditType;
  status: AuditStatus;
  
  // Scope
  scope: string;
  objectives: string[];
  criteria: string[];
  
  // Timing
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Team
  leadAuditor: string; // User ID
  auditTeam: string[]; // User IDs
  auditees: string[]; // User IDs being audited
  
  // Areas Covered
  departmentsCovered: string[];
  shipsCovered: string[]; // Ship IDs
  processesCovered: string[];
  
  // Findings
  findings: AuditFinding[];
  observations: AuditObservation[];
  
  // Summary
  executiveSummary: string;
  overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  keyStrengths: string[];
  areasForImprovement: string[];
  
  // Follow-up
  correctiveActions: CorrectiveAction[];
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Documentation
  evidence: string[]; // Document/photo references
  workingPapers: string[];
  reportAttachments: string[];
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AuditFinding {
  id: string;
  findingNumber: string;
  category: 'major' | 'minor' | 'observation' | 'opportunity';
  title: string;
  description: string;
  criteria: string; // What standard/requirement was not met
  evidence: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Responsible Party
  responsiblePerson: string; // User ID
  responsibleDepartment: string;
  
  // Corrective Action
  proposedAction: string;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  verificationRequired: boolean;
  verificationDate?: Date;
  verifiedBy?: string; // User ID
  
  status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
}

export interface AuditObservation {
  id: string;
  category: string;
  description: string;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CorrectiveAction {
  id: string;
  findingId: string;
  description: string;
  assignedTo: string; // User ID
  targetDate: Date;
  completionDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  evidence?: string[];
  verificationRequired: boolean;
  verifiedBy?: string; // User ID
  verificationDate?: Date;
}

// Legal Documents and Compliance
export interface LegalDocument {
  id: string;
  title: string;
  type: 'contract' | 'agreement' | 'certificate' | 'license' | 'permit' | 'insurance' | 'regulation' | 'other';
  documentNumber: string;
  
  // Parties Involved
  parties: DocumentParty[];
  
  // Validity
  issueDate: Date;
  expiryDate?: Date;
  renewalDate?: Date;
  
  // Content
  description: string;
  keyTerms: string[];
  obligations: string[];
  
  // Status
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal' | 'under_review';
  
  // Related Entities
  vendorId?: string;
  shipIds: string[];
  departmentIds: string[];
  
  // Compliance
  complianceRequirements: string[];
  nextReviewDate?: Date;
  responsiblePerson: string; // User ID
  
  // Documents
  attachments: string[];
  relatedDocuments: string[]; // Other document IDs
  
  // Notifications
  reminderDays: number; // Days before expiry to send reminder
  lastReminderSent?: Date;
  
  // Metadata
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DocumentParty {
  name: string;
  type: 'company' | 'vendor' | 'authority' | 'individual' | 'other';
  role: string; // e.g., 'contractor', 'client', 'guarantor'
  contactInfo?: string;
}

// Dashboard Statistics
export interface RequisitionStats {
  totalRequisitions: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  urgent: number;
  totalValue: number;
  averageProcessingTime: number; // Days
  byDepartment: Record<string, number>;
  byMonth: Record<string, number>;
  byVendor: Record<string, number>;
}

export interface PurchaseOrderStats {
  totalPOs: number;
  pendingDelivery: number;
  completed: number;
  overdue: number;
  totalValue: number;
  averageLeadTime: number; // Days
  onTimeDeliveryRate: number; // Percentage
}

export interface WorkOrderStats {
  totalWOs: number;
  inProgress: number;
  completed: number;
  overdue: number;
  averageCompletionTime: number; // Hours
  byType: Record<WorkOrderType, number>;
  byPriority: Record<string, number>;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  topPerformers: Vendor[];
  averageRating: number;
  totalOrders: number;
  totalSpend: number;
}
