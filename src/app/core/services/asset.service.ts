import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { Asset, AssetAssignment, AssetInput } from '../models/asset.model';

// ═══════════════════════════════════════════
// AI suggestion result
// ═══════════════════════════════════════════
export interface AssetSuggestion {
  assetType?: string;
  model?: string;
  serialNumber?: string;
  barcode?: string;
  condition?: string;
  description?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AssetService {

  private gql = inject(GraphqlService);

  async list(): Promise<Asset[]> {
    const q = `
      query {
        assets { id assetType model serialNumber barcode status condition description createdAt updatedAt }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q));
    return r.assets ?? [];
  }

  async get(id: string): Promise<Asset> {
    const q = `
      query Asset($id: ID!) {
        asset(id: $id) { id assetType model serialNumber barcode status condition description createdAt updatedAt }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q, { id }));
    return r.asset;
  }

  async create(input: AssetInput): Promise<Asset> {
    const q = `
      mutation Create($input: AssetInput!) {
        createAsset(input: $input) { id barcode status condition description }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q, { input }));
    return r.createAsset;
  }

  async update(id: string, input: AssetInput): Promise<Asset> {
    const q = `
      mutation Update($id: ID!, $input: AssetInput!) {
        updateAsset(id: $id, input: $input) { id barcode status condition description }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q, { id, input }));
    return r.updateAsset;
  }

  async remove(id: string): Promise<boolean> {
    const q = `mutation Del($id: ID!) { deleteAsset(id: $id) }`;
    const r: any = await firstValueFrom(this.gql.request(q, { id }));
    return r.deleteAsset;
  }

  /** Alias for `remove()` — kept for backward compatibility. */
  async delete(id: string): Promise<boolean> {
    return this.remove(id);
  }

  async history(assetId: string): Promise<AssetAssignment[]> {
    const q = `
      query History($assetId: ID!) {
        assetHistory(assetId: $assetId) {
          id assignedAt returnedAt assignedBy returnedBy
          assignNotes returnNotes
          conditionAtAssign conditionAtReturn
          open
          user { id email fullName }
          asset { id barcode model status condition description }
        }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q, { assetId }));
    return r.assetHistory ?? [];
  }

  async assign(assetId: string, userId: string, notes: string, condition: string): Promise<AssetAssignment> {
    const q = `
      mutation Assign($assetId: ID!, $userId: ID!, $notes: String, $condition: AssetCondition) {
        assignAsset(assetId: $assetId, userId: $userId, notes: $notes, condition: $condition) {
          id assignedAt assignedBy conditionAtAssign
          asset { id barcode status condition }
          user { id email fullName }
        }
      }`;
    const r: any = await firstValueFrom(
      this.gql.request(q, { assetId, userId, notes, condition })
    );
    return r.assignAsset;
  }

  async returnAsset(assetId: string, notes: string, condition: string): Promise<AssetAssignment> {
    const q = `
      mutation Return($assetId: ID!, $notes: String, $condition: AssetCondition) {
        returnAsset(assetId: $assetId, notes: $notes, condition: $condition) {
          id assignedAt returnedAt returnedBy conditionAtAssign conditionAtReturn
          asset { id barcode status condition }
        }
      }`;
    const r: any = await firstValueFrom(
      this.gql.request(q, { assetId, notes, condition })
    );
    return r.returnAsset;
  }

  // ---------- My Assets (regular users) ----------
  async myCurrentAssets(): Promise<AssetAssignment[]> {
    const q = `
      query {
        myCurrentAssets {
          id assignedAt assignNotes
          asset { id assetType model serialNumber barcode condition status }
        }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q));
    return r.myCurrentAssets ?? [];
  }

  async myAssetHistory(): Promise<AssetAssignment[]> {
    const q = `
      query {
        myAssetHistory {
          id assignedAt returnedAt returnNotes
          asset { id assetType model serialNumber barcode condition }
        }
      }`;
    const r: any = await firstValueFrom(this.gql.request(q));
    return r.myAssetHistory ?? [];
  }

  // ---------- AI: fill form fields from free-text description ----------
  /**
   * Send a free-text description of an asset and let the backend AI
   * extract the individual fields (type, model, serial, barcode, condition, description).
   */
  async suggestFields(description: string): Promise<AssetSuggestion> {
    const q = `
      mutation SuggestFields($description: String!) {
        suggestAssetFields(description: $description) {
          assetType
          model
          serialNumber
          barcode
          condition
          description
          message
        }
      }
    `;
    const r: any = await firstValueFrom(
      this.gql.request(q, { description })
    );
    return r.suggestAssetFields;
  }
}