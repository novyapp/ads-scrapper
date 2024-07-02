export interface IAdItem {
  localId: number;
  title: string;
  thumbnail: string;
  url: string;
  city: string;
  type: AD_TYPE;
  productType: PRODUCT_TYPE;
  pricePLN: string;
  date: string;
  timestamp: number;
}

export enum AD_TYPE {
  BUY_NOW = "BUY_NOW",
  AUCTION = "AUCTION",
}

export enum PRODUCT_TYPE {
  NEW = "NEW",
  USED = "USED",
}

export interface IOlxRawData {
  localId: number;
  title: string;
  thumbnail: string;
  url: string;
  city: string;
  type: string;
  pricePLN: string;
}
