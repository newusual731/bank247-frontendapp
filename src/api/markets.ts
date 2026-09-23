import { apiRequest } from "./client";
import { toQuery, type PageResponse } from "./types";

export type TreasuryDeal = {
  id: string;
  dealReference: string;
  dealType: string;
  status: string;
  deskCode?: string;
  counterpartyId?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  notionalAmount?: number | string;
  agreedRate?: number | string;
  tradeDate?: string;
  maturityDate?: string;
};

export type TradeInstrument = {
  id: string;
  instrumentReference: string;
  instrumentType: string;
  status: string;
  beneficiaryName?: string;
  currency: string;
  faceAmount?: number | string;
  expiryDate?: string;
  applicationDate?: string;
};

export function searchTreasuryDeals(params: {
  dealType?: string;
  status?: string;
  deskCode?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<TreasuryDeal>>(
    `/api/v1/treasury/deals${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function searchTradeInstruments(params: {
  instrumentType?: string;
  status?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<TradeInstrument>>(
    `/api/v1/trade/instruments${toQuery({ page: 0, size: 20, ...params })}`,
  );
}

export function createTreasuryDeal(body: {
  requestReference: string;
  dealType: string;
  deskCode: string;
  dealerId: string;
  counterpartyId: string;
  baseCurrency: string;
  quoteCurrency?: string;
  notionalAmount: number;
  agreedRate?: number;
  tradeDate: string;
  valueDate: string;
  maturityDate?: string;
  narration?: string;
}) {
  return apiRequest<TreasuryDeal>("/api/v1/treasury/deals", { method: "POST", body });
}

export function bookTreasuryDeal(dealReference: string) {
  return apiRequest<TreasuryDeal>(
    `/api/v1/treasury/deals/${encodeURIComponent(dealReference)}/book`,
    { method: "POST" },
  );
}

export function createTradeInstrument(body: {
  applicationReference: string;
  instrumentType: string;
  customerId: string;
  applicantAccount: string;
  beneficiaryName: string;
  counterpartyBankCode?: string;
  currency: string;
  amount: number;
  applicationDate: string;
  expiryDate: string;
  purpose?: string;
  tenorDays?: number;
}) {
  return apiRequest<TradeInstrument>("/api/v1/trade/instruments", { method: "POST", body });
}
