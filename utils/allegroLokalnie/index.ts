import { PRODUCT_TYPE } from "../../types/interfaces";

export const getOlxProductCondition = (condition: string) => {
  switch (condition) {
    case "Używane": {
      return PRODUCT_TYPE.USED;
    }
    case "Nowe": {
      return PRODUCT_TYPE.NEW;
    }
  }
};
