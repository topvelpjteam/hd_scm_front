/**
 * 금액 계산 유틸리티 함수
 * 금액계산방법.TXT의 계산 로직을 구현
 */

export interface PriceCalculationInput {
  /** 소비자가격단가 */
  consumerPrice: number;
  /** 수량 */
  quantity: number;
  /** 할인율 (%) */
  saleRate: number;
}

export interface PriceCalculationResult {
  /** 소비자가총금액 */
  consumerTotalAmount: number;
  /** 소비자가부가세 */
  consumerVat: number;
  /** 소비자가공급가 */
  consumerSupplyAmount: number;
  /** 주문총금액 */
  orderTotalAmount: number;
  /** 주문단가 */
  orderUnitPrice: number;
  /** 주문부가세 */
  orderVat: number;
  /** 주문공급가 */
  orderSupplyAmount: number;
}

/**
 * 금액 계산 함수
 * 금액계산방법.TXT의 순서대로 계산
 * 
 * @param input 계산에 필요한 입력값
 * @returns 계산된 금액 정보
 */
export const calculatePrices = (input: PriceCalculationInput): PriceCalculationResult => {
  const { consumerPrice, quantity, saleRate } = input;
  
  // 수량이 마이너스일 때는 절대값을 취한 후 계산하고, 마지막에 원래 부호로 복원
  const isNegativeQuantity = quantity < 0;
  const absQuantity = Math.abs(quantity);
  
  // 1. 소비자가총금액 = 소비자가격단가 * 수량
  const consumerTotalAmount = consumerPrice * absQuantity;
  
  // 2. 소비자가부가세 = 소비자가총금액 / 1.1 / 10
  const consumerVat = consumerTotalAmount / 1.1 / 10;
  
  // 3. 소비자가공급가 = 소비자가총금액 - 소비자가부가세
  const consumerSupplyAmount = consumerTotalAmount - consumerVat;
  
  // 4. 주문총금액 = 소비자가격단가 * 수량 * ((100 - 할인율) / 100)
  const orderTotalAmount = consumerPrice * absQuantity * ((100 - saleRate) / 100);
  
  // 5. 주문단가 = 소비자가격단가 * ((100 - 할인율) / 100)
  const orderUnitPrice = consumerPrice * ((100 - saleRate) / 100);
  
  // 6. 주문부가세 = 주문총금액 / 1.1 / 10
  const orderVat = orderTotalAmount / 1.1 / 10;
  
  // 7. 주문공급가 = 주문총금액 - 주문부가세
  const orderSupplyAmount = orderTotalAmount - orderVat;
  
  // 수량이 마이너스였던 경우 결과값들에 마이너스 부호 적용
  const sign = isNegativeQuantity ? -1 : 1;
  
  return {
    consumerTotalAmount: consumerTotalAmount * sign,
    consumerVat: consumerVat * sign,
    consumerSupplyAmount: consumerSupplyAmount * sign,
    orderTotalAmount: orderTotalAmount * sign,
    orderUnitPrice: orderUnitPrice, // 주문단가는 수량과 무관하므로 부호 변경하지 않음
    orderVat: orderVat * sign,
    orderSupplyAmount: orderSupplyAmount * sign
  };
};

/**
 * 숫자를 소수점 둘째 자리까지 반올림하는 함수
 * @param value 반올림할 숫자
 * @returns 반올림된 숫자
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * 숫자를 정수로 반올림하는 함수 (공급가, 부가세용)
 * @param value 반올림할 숫자
 * @returns 정수로 반올림된 숫자
 */
export const roundToInteger = (value: number): number => {
  return Math.round(value);
};

/**
 * 금액 계산 결과를 정수로 반올림하여 반환 (그리드 표시용)
 * - 모든 금액 관련 숫자: 정수로 반올림
 * @param input 계산에 필요한 입력값
 * @returns 정수로 반올림된 계산 결과
 */
export const calculatePricesRounded = (input: PriceCalculationInput): PriceCalculationResult => {
  const result = calculatePrices(input);
  
  return {
    consumerTotalAmount: roundToInteger(result.consumerTotalAmount), // 소비자가총금액: 정수
    consumerVat: roundToInteger(result.consumerVat), // 소비자가부가세: 정수
    consumerSupplyAmount: roundToInteger(result.consumerSupplyAmount), // 소비자가공급가: 정수
    orderTotalAmount: roundToInteger(result.orderTotalAmount), // 주문총금액: 정수
    orderUnitPrice: roundToInteger(result.orderUnitPrice), // 주문단가: 정수
    orderVat: roundToInteger(result.orderVat), // 주문부가세: 정수
    orderSupplyAmount: roundToInteger(result.orderSupplyAmount) // 주문공급가: 정수
  };
};
