import { User } from "./user.model";

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RETIRED = 'RETIRED',
  LOST = 'LOST',
  STOLEN = 'STOLEN',
}

export enum AssetCondition {
  NEW = 'NEW',
  VERYGOOD = 'VERYGOOD',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
}

export interface Asset {
  id: string;
  assetType: string;
  model: string;
  serialNumber: string;
  barcode: string;
  status: AssetStatus;
  condition: AssetCondition;
  description?: string;     
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetInput {
  assetType?: string;
  model?: string;
  serialNumber?: string;
  barcode?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  description?: string;      
}

export interface AssetAssignment {
  id: string;
  asset: Asset;
  user: User;
  assignedAt: string;
  assignedBy: string;
  returnedAt?: string;
  returnedBy?: string;
  assignNotes?: string;
  returnNotes?: string;
  conditionAtAssign?: AssetCondition;
  conditionAtReturn?: AssetCondition;
  open: boolean;
}