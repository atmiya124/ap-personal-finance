// Income Tax Calculator (Old vs New Regime)
// Tax slabs - adjusted for CAD/USD currency

export type Regime = "old" | "new";

export interface TaxSlab {
  min: number;
  max: number;
  rate: number;
}

export interface TaxCalculationResult {
  baseTax: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: {
    slab: string;
    taxable: number;
    tax: number;
  }[];
}

// Old Regime Slabs (FY 2024-25)
const OLD_REGIME_SLABS: TaxSlab[] = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

// New Regime Slabs (FY 2024-25)
const NEW_REGIME_SLABS: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

const CESS_RATE = 0.04; // 4% cess

export function calculateTax(
  taxableIncome: number,
  regime: Regime
): TaxCalculationResult {
  const slabs = regime === "old" ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  let baseTax = 0;
  const breakdown: { slab: string; taxable: number; tax: number }[] = [];
  let remainingIncome = taxableIncome;

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    const slabMin = slab.min;
    const slabMax = slab.max === Infinity ? remainingIncome : Math.min(slab.max, remainingIncome);
    
    if (remainingIncome <= slabMin) break;

    const taxableInSlab = Math.max(0, slabMax - slabMin);
    const taxInSlab = (taxableInSlab * slab.rate) / 100;

      if (taxableInSlab > 0) {
        const formatAmount = (amt: number) => {
          if (amt >= 100000) return `${(amt / 100000).toFixed(1)}L`;
          if (amt >= 1000) return `${(amt / 1000).toFixed(0)}K`;
          return amt.toString();
        };
        breakdown.push({
          slab: slabMax === Infinity 
            ? `Above ₹${formatAmount(slabMin)}`
            : `₹${formatAmount(slabMin)} - ₹${formatAmount(slabMax)}`,
          taxable: taxableInSlab,
          tax: taxInSlab,
        });
      }

    baseTax += taxInSlab;
    remainingIncome -= taxableInSlab;
  }

  const cess = baseTax * CESS_RATE;
  const totalTax = baseTax + cess;
  const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

  return {
    baseTax,
    cess,
    totalTax,
    effectiveRate,
    breakdown,
  };
}

export function calculateOldRegimeTax(taxableIncome: number): TaxCalculationResult {
  return calculateTax(taxableIncome, "old");
}

export function calculateNewRegimeTax(taxableIncome: number): TaxCalculationResult {
  return calculateTax(taxableIncome, "new");
}

export function compareRegimes(taxableIncome: number): {
  old: TaxCalculationResult;
  new: TaxCalculationResult;
  delta: number;
  betterRegime: Regime;
} {
  const oldResult = calculateOldRegimeTax(taxableIncome);
  const newResult = calculateNewRegimeTax(taxableIncome);
  const delta = oldResult.totalTax - newResult.totalTax;
  const betterRegime: Regime = delta > 0 ? "new" : "old";

  return {
    old: oldResult,
    new: newResult,
    delta: Math.abs(delta),
    betterRegime,
  };
}

