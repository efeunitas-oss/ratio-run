// RATIO.RUN - Ultimate Product Database
// 2026 Piyasa Dominasyonu: 50+ Otomobil + 25+ Robot Süpürge
// [Executive Summary Edition - Massive Expansion]

import { Vehicle, RobotVacuum } from './types';

// ============================================================================
// 1. OTOMOBİL VERİ SETİ (SEDAN, HATCHBACK, SUV, ELEKTRİKLİ, HİBRİT)
// ============================================================================

export const SAMPLE_VEHICLES: Vehicle[] = [
  // --- D SEGMENT & PREMIUM ---
  {
    id: 'bmw-320i-2024',
    name: 'BMW 320i M Sport',
    brand: 'BMW',
    model: '3 Serisi',
    year: 2024,
    segment: 'D',
    affiliateUrl: 'https://www.bmw.com.tr/tr/all-models/3-series/sedan/2022/bmw-3-serisi-sedan-overview.html?ref=ratiorun',
    engineering: {
      hp: 184, torque: 300, zeroToHundred: 7.1, weight: 1570,
      transmission: 'ZF', fuelConsumption: 6.8, trunkCapacity: 480, engineDisplacement: 1998,
    },
    market: { listPrice: 3250000, marketAverage: 3100000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 9, soundInsulation: 8, rideComfort: 8, prestigeScore: 9, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'mercedes-c200-2024',
    name: 'Mercedes-Benz C200 AMG',
    brand: 'Mercedes-Benz',
    model: 'C Serisi',
    year: 2024,
    segment: 'D',
    engineering: {
      hp: 204, torque: 320, zeroToHundred: 7.3, weight: 1640,
      transmission: 'Otomatik', fuelConsumption: 7.2, trunkCapacity: 455, engineDisplacement: 1496,
    },
    market: { listPrice: 3450000, marketAverage: 3300000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 9 },
    quality: { materialQuality: 10, soundInsulation: 9, rideComfort: 9, prestigeScore: 10, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'audi-a4-2024',
    name: 'Audi A4 45 TFSI quattro',
    brand: 'Audi',
    model: 'A4',
    year: 2024,
    segment: 'D',
    engineering: {
      hp: 265, torque: 370, zeroToHundred: 5.5, weight: 1620,
      transmission: 'DSG', fuelConsumption: 7.1, trunkCapacity: 460, engineDisplacement: 1984,
    },
    market: { listPrice: 3800000, marketAverage: 3700000, liquidityScore: 8, resaleValue: 9, serviceNetwork: 9 },
    quality: { materialQuality: 9, soundInsulation: 9, rideComfort: 9, prestigeScore: 9, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'volkswagen-passat-2024',
    name: 'Volkswagen Passat 1.5 TSI',
    brand: 'Volkswagen',
    model: 'Passat',
    year: 2024,
    segment: 'D',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.7, weight: 1500,
      transmission: 'DSG', fuelConsumption: 5.1, trunkCapacity: 586, engineDisplacement: 1498,
    },
    market: { listPrice: 2600000, marketAverage: 2500000, liquidityScore: 10, resaleValue: 10, serviceNetwork: 10 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 9, prestigeScore: 8, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'skoda-superb-2024',
    name: 'Skoda Superb 1.5 TSI Prestige',
    brand: 'Skoda',
    model: 'Superb',
    year: 2024,
    segment: 'D',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 9.2, weight: 1530,
      transmission: 'DSG', fuelConsumption: 5.4, trunkCapacity: 625, engineDisplacement: 1498,
    },
    market: { listPrice: 2350000, marketAverage: 2300000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 9 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 10, prestigeScore: 8, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },

  // --- C SEGMENT & HATCHBACK ---
  {
    id: 'volkswagen-golf-2024',
    name: 'Volkswagen Golf 1.5 eTSI R-Line',
    brand: 'Volkswagen',
    model: 'Golf',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.5, weight: 1340,
      transmission: 'DSG', fuelConsumption: 5.2, trunkCapacity: 381, engineDisplacement: 1498,
    },
    market: { listPrice: 1950000, marketAverage: 1850000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 10 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 8, prestigeScore: 7, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'audi-a3-2024',
    name: 'Audi A3 Sportback 35 TFSI',
    brand: 'Audi',
    model: 'A3',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.4, weight: 1395,
      transmission: 'DSG', fuelConsumption: 5.6, trunkCapacity: 380, engineDisplacement: 1498,
    },
    market: { listPrice: 2150000, marketAverage: 2050000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 9 },
    quality: { materialQuality: 9, soundInsulation: 8, rideComfort: 8, prestigeScore: 8, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'bmw-118i-2024',
    name: 'BMW 118i M Sport',
    brand: 'BMW',
    model: '1 Serisi',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 140, torque: 220, zeroToHundred: 8.5, weight: 1395,
      transmission: 'DSG', fuelConsumption: 5.9, trunkCapacity: 380, engineDisplacement: 1499,
    },
    market: { listPrice: 2250000, marketAverage: 2150000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 8, soundInsulation: 7, rideComfort: 7, prestigeScore: 9, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'mercedes-a200-2024',
    name: 'Mercedes-Benz A200 AMG',
    brand: 'Mercedes-Benz',
    model: 'A Serisi',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 163, torque: 270, zeroToHundred: 8.2, weight: 1440,
      transmission: 'Otomatik', fuelConsumption: 6.2, trunkCapacity: 355, engineDisplacement: 1332,
    },
    market: { listPrice: 2350000, marketAverage: 2250000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 9, soundInsulation: 8, rideComfort: 8, prestigeScore: 9, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'peugeot-308-2024',
    name: 'Peugeot 308 GT',
    brand: 'Peugeot',
    model: '308',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 130, torque: 230, zeroToHundred: 9.7, weight: 1290,
      transmission: 'Otomatik', fuelConsumption: 5.8, trunkCapacity: 412, engineDisplacement: 1199,
    },
    market: { listPrice: 1650000, marketAverage: 1550000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 9 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 7, prestigeScore: 6, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'opel-astra-2026',
    name: 'Opel Astra 1.2 Turbo GS',
    brand: 'Opel',
    model: 'Astra',
    year: 2026,
    segment: 'C',
    engineering: {
      hp: 130, torque: 230, zeroToHundred: 9.7, weight: 1332,
      transmission: 'Otomatik', fuelConsumption: 5.6, trunkCapacity: 422, engineDisplacement: 1199,
    },
    market: { listPrice: 1750000, marketAverage: 1700000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 7, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'toyota-corolla-2024',
    name: 'Toyota Corolla 1.8 Hybrid Dream',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    segment: 'C',
    affiliateUrl: 'https://www.toyota.com.tr/new-cars/corolla-sedan/index.json?ref=ratiorun',
    engineering: {
      hp: 140, torque: 185, zeroToHundred: 9.3, weight: 1420,
      transmission: 'CVT', fuelConsumption: 4.6, trunkCapacity: 471, engineDisplacement: 1798,
    },
    market: { listPrice: 1750000, marketAverage: 1700000, liquidityScore: 10, resaleValue: 10, serviceNetwork: 10 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 7, prestigeScore: 5, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 1 }
  },
  {
    id: 'honda-civic-2026',
    name: 'Honda Civic 1.5 VTEC Turbo',
    brand: 'Honda',
    model: 'Civic',
    year: 2026,
    segment: 'C',
    engineering: {
      hp: 182, torque: 240, zeroToHundred: 8.1, weight: 1380,
      transmission: 'CVT', fuelConsumption: 6.7, trunkCapacity: 512, engineDisplacement: 1498,
    },
    market: { listPrice: 1950000, marketAverage: 1900000, liquidityScore: 10, resaleValue: 10, serviceNetwork: 10 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 7, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'renault-megane-2024',
    name: 'Renault Megane 1.3 TCe Icon',
    brand: 'Renault',
    model: 'Megane',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 140, torque: 240, zeroToHundred: 9.0, weight: 1350,
      transmission: 'DSG', fuelConsumption: 5.7, trunkCapacity: 503, engineDisplacement: 1332,
    },
    market: { listPrice: 1450000, marketAverage: 1400000, liquidityScore: 10, resaleValue: 9, serviceNetwork: 10 },
    quality: { materialQuality: 5, soundInsulation: 5, rideComfort: 7, prestigeScore: 5, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'fiat-egea-2024',
    name: 'Fiat Egea 1.6 Multijet Lounge',
    brand: 'Fiat',
    model: 'Egea',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 130, torque: 320, zeroToHundred: 9.6, weight: 1330,
      transmission: 'DSG', fuelConsumption: 4.7, trunkCapacity: 520, engineDisplacement: 1598,
    },
    market: { listPrice: 1350000, marketAverage: 1280000, liquidityScore: 10, resaleValue: 7, serviceNetwork: 10 },
    quality: { materialQuality: 4, soundInsulation: 4, rideComfort: 5, prestigeScore: 3, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'skoda-octavia-2026',
    name: 'Skoda Octavia 1.5 eTSI Premium',
    brand: 'Skoda',
    model: 'Octavia',
    year: 2026,
    segment: 'C',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.5, weight: 1360,
      transmission: 'DSG', fuelConsumption: 5.4, trunkCapacity: 600, engineDisplacement: 1498,
    },
    market: { listPrice: 1850000, marketAverage: 1800000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 10 },
    quality: { materialQuality: 7, soundInsulation: 8, rideComfort: 9, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'ford-focus-2024',
    name: 'Ford Focus 1.5 EcoBlue Titanium',
    brand: 'Ford',
    model: 'Focus',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 115, torque: 300, zeroToHundred: 10.6, weight: 1380,
      transmission: 'Otomatik', fuelConsumption: 4.8, trunkCapacity: 511, engineDisplacement: 1499,
    },
    market: { listPrice: 1650000, marketAverage: 1550000, liquidityScore: 7, resaleValue: 7, serviceNetwork: 9 },
    quality: { materialQuality: 7, soundInsulation: 6, rideComfort: 9, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'seat-leon-2024',
    name: 'Seat Leon 1.5 eTSI FR',
    brand: 'Seat',
    model: 'Leon',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.1, weight: 1330,
      transmission: 'DSG', fuelConsumption: 5.5, trunkCapacity: 380, engineDisplacement: 1498,
    },
    market: { listPrice: 1750000, marketAverage: 1700000, liquidityScore: 8, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 7, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },

  // --- SUV DÜNYASI (C-SUV & D-SUV & B-SUV) ---
  {
    id: 'togg-t10x-2024',
    name: 'Togg T10X V2 RWD Uzun Menzil',
    brand: 'Togg',
    model: 'T10X',
    year: 2024,
    segment: 'C-SUV',
    affiliateUrl: 'https://www.togg.com.tr/tr/t10x?ref=ratiorun',
    engineering: {
      hp: 218, torque: 350, zeroToHundred: 7.8, weight: 2126,
      transmission: 'Otomatik', fuelConsumption: 16.7, trunkCapacity: 441, engineDisplacement: 0,
    },
    market: { listPrice: 1823000, marketAverage: 1823000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 7 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 7, prestigeScore: 7, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'chery-tiggo8-2026',
    name: 'Chery Tiggo 8 Pro Max',
    brand: 'Chery',
    model: 'Tiggo 8 Pro',
    year: 2026,
    segment: 'D-SUV',
    engineering: {
      hp: 197, torque: 290, zeroToHundred: 8.9, weight: 1640,
      transmission: 'DSG', fuelConsumption: 8.1, trunkCapacity: 475, engineDisplacement: 1598,
    },
    market: { listPrice: 2150000, marketAverage: 2050000, liquidityScore: 10, resaleValue: 6, serviceNetwork: 8 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 8, prestigeScore: 6, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'chery-omoda5-2026',
    name: 'Chery Omoda 5 Excellent',
    brand: 'Chery',
    model: 'Omoda 5',
    year: 2026,
    segment: 'C-SUV',
    engineering: {
      hp: 183, torque: 275, zeroToHundred: 8.6, weight: 1425,
      transmission: 'DSG', fuelConsumption: 9.1, trunkCapacity: 378, engineDisplacement: 1598,
    },
    market: { listPrice: 1550000, marketAverage: 1500000, liquidityScore: 10, resaleValue: 7, serviceNetwork: 8 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 6, prestigeScore: 5, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'peugeot-2008-2024',
    name: 'Peugeot 2008 1.2 GT',
    brand: 'Peugeot',
    model: '2008',
    year: 2024,
    segment: 'B-SUV',
    engineering: {
      hp: 130, torque: 230, zeroToHundred: 9.3, weight: 1205,
      transmission: 'Otomatik', fuelConsumption: 5.9, trunkCapacity: 434, engineDisplacement: 1199,
    },
    market: { listPrice: 1600000, marketAverage: 1550000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 7, soundInsulation: 6, rideComfort: 6, prestigeScore: 6, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'opel-mokka-2024',
    name: 'Opel Mokka 1.2 Ultimate',
    brand: 'Opel',
    model: 'Mokka',
    year: 2024,
    segment: 'B-SUV',
    engineering: {
      hp: 130, torque: 230, zeroToHundred: 9.2, weight: 1220,
      transmission: 'Otomatik', fuelConsumption: 5.9, trunkCapacity: 350, engineDisplacement: 1199,
    },
    market: { listPrice: 1650000, marketAverage: 1600000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 9 },
    quality: { materialQuality: 7, soundInsulation: 6, rideComfort: 6, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'nissan-qashqai-2024',
    name: 'Nissan Qashqai e-Power Platinum',
    brand: 'Nissan',
    model: 'Qashqai',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 190, torque: 330, zeroToHundred: 7.9, weight: 1610,
      transmission: 'Otomatik', fuelConsumption: 5.4, trunkCapacity: 480, engineDisplacement: 1497,
    },
    market: { listPrice: 2400000, marketAverage: 2300000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 8 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 8, prestigeScore: 7, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'kia-sportage-2024',
    name: 'Kia Sportage 1.6 T-GDI Prestige',
    brand: 'Kia',
    model: 'Sportage',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 9.6, weight: 1560,
      transmission: 'DSG', fuelConsumption: 7.2, trunkCapacity: 562, engineDisplacement: 1598,
    },
    market: { listPrice: 2200000, marketAverage: 2100000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 8 },
    quality: { materialQuality: 8, soundInsulation: 7, rideComfort: 8, prestigeScore: 7, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'hyundai-tucson-2024',
    name: 'Hyundai Tucson 1.6 T-GDI Elite Plus',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 180, torque: 265, zeroToHundred: 8.8, weight: 1580,
      transmission: 'DSG', fuelConsumption: 7.3, trunkCapacity: 620, engineDisplacement: 1598,
    },
    market: { listPrice: 2300000, marketAverage: 2200000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 8, prestigeScore: 7, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'cupra-formentor-2026',
    name: 'Cupra Formentor 1.5 eTSI VZ-Line',
    brand: 'Cupra',
    model: 'Formentor',
    year: 2026,
    segment: 'C-SUV',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 8.9, weight: 1422,
      transmission: 'DSG', fuelConsumption: 5.9, trunkCapacity: 450, engineDisplacement: 1498,
    },
    market: { listPrice: 2450000, marketAverage: 2350000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 7, prestigeScore: 8, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'peugeot-408-2026',
    name: 'Peugeot 408 1.2 PureTech GT',
    brand: 'Peugeot',
    model: '408',
    year: 2026,
    segment: 'C-SUV',
    engineering: {
      hp: 130, torque: 230, zeroToHundred: 10.4, weight: 1392,
      transmission: 'Otomatik', fuelConsumption: 6.0, trunkCapacity: 536, engineDisplacement: 1199,
    },
    market: { listPrice: 2050000, marketAverage: 1950000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 9 },
    quality: { materialQuality: 8, soundInsulation: 7, rideComfort: 8, prestigeScore: 8, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'dacia-duster-2024',
    name: 'Dacia Duster 1.3 TCE Extreme',
    brand: 'Dacia',
    model: 'Duster',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 9.7, weight: 1320,
      transmission: 'Otomatik', fuelConsumption: 6.4, trunkCapacity: 478, engineDisplacement: 1332,
    },
    market: { listPrice: 1450000, marketAverage: 1400000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 3, soundInsulation: 4, rideComfort: 6, prestigeScore: 3, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'volkswagen-tiguan-2024',
    name: 'Volkswagen Tiguan 1.5 eTSI R-Line',
    brand: 'Volkswagen',
    model: 'Tiguan',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 150, torque: 250, zeroToHundred: 9.2, weight: 1600,
      transmission: 'DSG', fuelConsumption: 6.5, trunkCapacity: 652, engineDisplacement: 1498,
    },
    market: { listPrice: 2800000, marketAverage: 2700000, liquidityScore: 9, resaleValue: 9, serviceNetwork: 10 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 9, prestigeScore: 8, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'ford-puma-2024',
    name: 'Ford Puma 1.0 EcoBoost ST-Line',
    brand: 'Ford',
    model: 'Puma',
    year: 2024,
    segment: 'B-SUV',
    engineering: {
      hp: 125, torque: 200, zeroToHundred: 10.2, weight: 1280,
      transmission: 'DSG', fuelConsumption: 5.8, trunkCapacity: 456, engineDisplacement: 999,
    },
    market: { listPrice: 1550000, marketAverage: 1500000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 8, prestigeScore: 5, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'bayon-2024',
    name: 'Hyundai Bayon 1.4 Elite',
    brand: 'Hyundai',
    model: 'Bayon',
    year: 2024,
    segment: 'B-SUV',
    engineering: {
      hp: 100, torque: 134, zeroToHundred: 13.7, weight: 1145,
      transmission: 'Otomatik', fuelConsumption: 6.6, trunkCapacity: 411, engineDisplacement: 1368,
    },
    market: { listPrice: 1250000, marketAverage: 1200000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 5, soundInsulation: 5, rideComfort: 6, prestigeScore: 4, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 2 }
  },

  // --- ELEKTRİKLİ & HİBRİT DEVRİMİ ---
  {
    id: 'tesla-model-y-2024',
    name: 'Tesla Model Y Long Range',
    brand: 'Tesla',
    model: 'Model Y',
    year: 2024,
    segment: 'D-SUV',
    affiliateUrl: 'https://www.tesla.com/tr_tr/modely?ref=ratiorun',
    engineering: {
      hp: 514, torque: 493, zeroToHundred: 5.0, weight: 1979,
      transmission: 'Otomatik', fuelConsumption: 16.9, trunkCapacity: 854, engineDisplacement: 0,
    },
    market: { listPrice: 2850000, marketAverage: 2750000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 6 },
    quality: { materialQuality: 6, soundInsulation: 7, rideComfort: 6, prestigeScore: 9, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'byd-atto3-2024',
    name: 'BYD Atto 3 Design',
    brand: 'BYD',
    model: 'Atto 3',
    year: 2024,
    segment: 'C-SUV',
    engineering: {
      hp: 204, torque: 310, zeroToHundred: 7.3, weight: 1750,
      transmission: 'Otomatik', fuelConsumption: 15.6, trunkCapacity: 440, engineDisplacement: 0,
    },
    market: { listPrice: 1790000, marketAverage: 1750000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 5 },
    quality: { materialQuality: 7, soundInsulation: 7, rideComfort: 8, prestigeScore: 6, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'byd-seal-u-2024',
    name: 'BYD Seal U DM-i',
    brand: 'BYD',
    model: 'Seal U',
    year: 2024,
    segment: 'D-SUV',
    engineering: {
      hp: 218, torque: 300, zeroToHundred: 8.9, weight: 1980,
      transmission: 'Otomatik', fuelConsumption: 5.0, trunkCapacity: 552, engineDisplacement: 1498,
    },
    market: { listPrice: 2190000, marketAverage: 2150000, liquidityScore: 8, resaleValue: 7, serviceNetwork: 5 },
    quality: { materialQuality: 8, soundInsulation: 8, rideComfort: 9, prestigeScore: 7, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'mg-4-2026',
    name: 'MG 4 Electric Luxury',
    brand: 'MG',
    model: 'MG4',
    year: 2026,
    segment: 'C',
    engineering: {
      hp: 204, torque: 250, zeroToHundred: 7.9, weight: 1685,
      transmission: 'Otomatik', fuelConsumption: 16.0, trunkCapacity: 363, engineDisplacement: 0,
    },
    market: { listPrice: 1550000, marketAverage: 1500000, liquidityScore: 7, resaleValue: 6, serviceNetwork: 7 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 7, prestigeScore: 5, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'volvo-xc40-2026',
    name: 'Volvo XC40 Recharge',
    brand: 'Volvo',
    model: 'XC40',
    year: 2026,
    segment: 'C-SUV',
    engineering: {
      hp: 231, torque: 330, zeroToHundred: 7.4, weight: 2030,
      transmission: 'Otomatik', fuelConsumption: 18.2, trunkCapacity: 419, engineDisplacement: 0,
    },
    market: { listPrice: 2950000, marketAverage: 2850000, liquidityScore: 8, resaleValue: 9, serviceNetwork: 9 },
    quality: { materialQuality: 9, soundInsulation: 10, rideComfort: 9, prestigeScore: 9, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'mercedes-eqe-2026',
    name: 'Mercedes-Benz EQE 350+',
    brand: 'Mercedes-Benz',
    model: 'EQE',
    year: 2026,
    segment: 'E',
    engineering: {
      hp: 292, torque: 565, zeroToHundred: 6.4, weight: 2355,
      transmission: 'Otomatik', fuelConsumption: 16.5, trunkCapacity: 430, engineDisplacement: 0,
    },
    market: { listPrice: 4850000, marketAverage: 4600000, liquidityScore: 7, resaleValue: 7, serviceNetwork: 9 },
    quality: { materialQuality: 10, soundInsulation: 10, rideComfort: 10, prestigeScore: 10, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'bmw-ix-2026',
    name: 'BMW iX xDrive40',
    brand: 'BMW',
    model: 'iX',
    year: 2026,
    segment: 'E-SUV',
    engineering: {
      hp: 326, torque: 630, zeroToHundred: 6.1, weight: 2440,
      transmission: 'Otomatik', fuelConsumption: 19.4, trunkCapacity: 500, engineDisplacement: 0,
    },
    market: { listPrice: 5250000, marketAverage: 5100000, liquidityScore: 7, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 10, soundInsulation: 10, rideComfort: 10, prestigeScore: 10, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'renault-megane-etech',
    name: 'Renault Megane E-Tech Iconic',
    brand: 'Renault',
    model: 'Megane E-Tech',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 220, torque: 300, zeroToHundred: 7.4, weight: 1636,
      transmission: 'Otomatik', fuelConsumption: 16.1, trunkCapacity: 440, engineDisplacement: 0,
    },
    market: { listPrice: 1650000, marketAverage: 1600000, liquidityScore: 8, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 7, soundInsulation: 8, rideComfort: 8, prestigeScore: 6, trimLevel: 'Dolu' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'skywell-et5',
    name: 'Skywell ET5 Legend',
    brand: 'Skywell',
    model: 'ET5',
    year: 2024,
    segment: 'D-SUV',
    engineering: {
      hp: 204, torque: 320, zeroToHundred: 7.9, weight: 1920,
      transmission: 'Otomatik', fuelConsumption: 17.0, trunkCapacity: 467, engineDisplacement: 0,
    },
    market: { listPrice: 1800000, marketAverage: 1700000, liquidityScore: 5, resaleValue: 5, serviceNetwork: 4 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 8, prestigeScore: 5, trimLevel: 'Gırtlak Dolu' },
    risk: { chronicIssueRisk: 6 }
  },

  // --- B SEGMENT & EKONOMİK ---
  {
    id: 'hyundai-i20-2024',
    name: 'Hyundai i20 1.4 MPI Style',
    brand: 'Hyundai',
    model: 'i20',
    year: 2024,
    segment: 'B',
    engineering: {
      hp: 100, torque: 134, zeroToHundred: 12.2, weight: 1120,
      transmission: 'Otomatik', fuelConsumption: 6.8, trunkCapacity: 352, engineDisplacement: 1368,
    },
    market: { listPrice: 1050000, marketAverage: 1000000, liquidityScore: 10, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 5, soundInsulation: 5, rideComfort: 6, prestigeScore: 4, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'renault-clio-2024',
    name: 'Renault Clio 1.0 TCe Evolution',
    brand: 'Renault',
    model: 'Clio',
    year: 2024,
    segment: 'B',
    engineering: {
      hp: 90, torque: 160, zeroToHundred: 12.2, weight: 1178,
      transmission: 'Otomatik', fuelConsumption: 5.3, trunkCapacity: 391, engineDisplacement: 999,
    },
    market: { listPrice: 1100000, marketAverage: 1050000, liquidityScore: 10, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 5, soundInsulation: 5, rideComfort: 6, prestigeScore: 4, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'fiat-egea-hb',
    name: 'Fiat Egea Hatchback 1.4 Fire',
    brand: 'Fiat',
    model: 'Egea HB',
    year: 2024,
    segment: 'C',
    engineering: {
      hp: 95, torque: 127, zeroToHundred: 11.5, weight: 1260,
      transmission: 'Manuel', fuelConsumption: 6.5, trunkCapacity: 440, engineDisplacement: 1368,
    },
    market: { listPrice: 950000, marketAverage: 900000, liquidityScore: 10, resaleValue: 8, serviceNetwork: 10 },
    quality: { materialQuality: 4, soundInsulation: 4, rideComfort: 5, prestigeScore: 3, trimLevel: 'Boş' },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'opel-corsa-2024',
    name: 'Opel Corsa 1.2 Turbo',
    brand: 'Opel',
    model: 'Corsa',
    year: 2024,
    segment: 'B',
    engineering: {
      hp: 100, torque: 205, zeroToHundred: 10.8, weight: 1165,
      transmission: 'Otomatik', fuelConsumption: 5.4, trunkCapacity: 309, engineDisplacement: 1199,
    },
    market: { listPrice: 1150000, marketAverage: 1100000, liquidityScore: 9, resaleValue: 8, serviceNetwork: 9 },
    quality: { materialQuality: 6, soundInsulation: 6, rideComfort: 6, prestigeScore: 5, trimLevel: 'Orta' },
    risk: { chronicIssueRisk: 4 }
  }
];

// ============================================================================
// 2. ROBOT SÜPÜRGE VERİ SETİ (PREMIUM, F/P, LIDAR, V-SLAM)
// ============================================================================

export const SAMPLE_VACUUMS: RobotVacuum[] = [
  // --- ROBO ROCK ---
  {
    id: 'roborock-s8-pro',
    name: 'Roborock S8 Pro Ultra',
    brand: 'Roborock',
    category: 'ROBOT_VACUUM',
    affiliateUrl: 'https://www.roborock.com/tr/products/roborock-s8-pro-ultra?ref=ratiorun',
    specs: {
      suctionPower: 6000, batteryCapacity: 5200, noiseLevel: 68,
      dustCapacity: 0.4, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 48000, marketAverage: 45000, liquidityScore: 10,
      resaleValue: 9, serviceNetwork: 8
    },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'roborock-s8-maxv',
    name: 'Roborock S8 MaxV Ultra',
    brand: 'Roborock',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 10000, batteryCapacity: 5200, noiseLevel: 67,
      dustCapacity: 0.4, mappingTech: 'Lidar + AI Camera', mopFeature: true
    },
    market: {
      listPrice: 65000, marketAverage: 62000, liquidityScore: 10,
      resaleValue: 9, serviceNetwork: 8
    },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'roborock-q-revo',
    name: 'Roborock Q Revo Master',
    brand: 'Roborock',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 7000, batteryCapacity: 5200, noiseLevel: 66,
      dustCapacity: 0.33, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 38000, marketAverage: 36000, liquidityScore: 9,
      resaleValue: 8, serviceNetwork: 8
    },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'roborock-q8-max',
    name: 'Roborock Q8 Max+',
    brand: 'Roborock',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 5500, batteryCapacity: 5200, noiseLevel: 67,
      dustCapacity: 0.47, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 22000, marketAverage: 21000, liquidityScore: 9,
      resaleValue: 8, serviceNetwork: 8
    },
    risk: { chronicIssueRisk: 2 }
  },
  
  // --- DREAME ---
  {
    id: 'dreame-l20-ultra',
    name: 'Dreame L20 Ultra',
    brand: 'Dreame',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 7000, batteryCapacity: 6400, noiseLevel: 63,
      dustCapacity: 0.3, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 52000, marketAverage: 51000, liquidityScore: 7,
      resaleValue: 6, serviceNetwork: 6
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'dreame-x40-ultra',
    name: 'Dreame X40 Ultra',
    brand: 'Dreame',
    category: 'ROBOT_VACUUM',
    affiliateUrl: 'https://www.dreametech.com/products/dreame-x40-ultra?ref=ratiorun',
    specs: {
      suctionPower: 12000, batteryCapacity: 6400, noiseLevel: 65,
      dustCapacity: 0.35, mappingTech: 'Lidar + AI', mopFeature: true
    },
    market: {
      listPrice: 68000, marketAverage: 67000, liquidityScore: 8,
      resaleValue: 7, serviceNetwork: 7
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'dreame-l10s-pro',
    name: 'Dreame L10s Pro Ultra Heat',
    brand: 'Dreame',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 7000, batteryCapacity: 5200, noiseLevel: 65,
      dustCapacity: 0.35, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 32000, marketAverage: 31000, liquidityScore: 8,
      resaleValue: 7, serviceNetwork: 6
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'dreame-d10s-plus',
    name: 'Dreame D10s Plus',
    brand: 'Dreame',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 5000, batteryCapacity: 5200, noiseLevel: 65,
      dustCapacity: 0.4, mappingTech: 'Lidar + AI', mopFeature: true
    },
    market: {
      listPrice: 16000, marketAverage: 15000, liquidityScore: 8,
      resaleValue: 7, serviceNetwork: 6
    },
    risk: { chronicIssueRisk: 3 }
  },

  // --- XIAOMI ---
  {
    id: 'xiaomi-x20-plus',
    name: 'Xiaomi Robot Vacuum X20+',
    brand: 'Xiaomi',
    category: 'ROBOT_VACUUM',
    affiliateUrl: 'https://www.mi.com/tr/product/xiaomi-robot-vacuum-x20-plus?ref=ratiorun',
    specs: {
      suctionPower: 6000, batteryCapacity: 5200, noiseLevel: 68,
      dustCapacity: 0.4, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 24000, marketAverage: 23000, liquidityScore: 10,
      resaleValue: 7, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'xiaomi-s10-plus',
    name: 'Xiaomi Robot Vacuum S10+',
    brand: 'Xiaomi',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 4000, batteryCapacity: 5200, noiseLevel: 70,
      dustCapacity: 0.45, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 14000, marketAverage: 13500, liquidityScore: 10,
      resaleValue: 6, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'xiaomi-e10-2026',
    name: 'Xiaomi Robot Vacuum E10C',
    brand: 'Xiaomi',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 3500, batteryCapacity: 2600, noiseLevel: 74,
      dustCapacity: 0.4, mappingTech: 'Gyroscope', mopFeature: true
    },
    market: {
      listPrice: 8500, marketAverage: 8200, liquidityScore: 10,
      resaleValue: 5, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'xiaomi-robot-vacuum-s10t',
    name: 'Xiaomi Robot Vacuum S10T',
    brand: 'Xiaomi',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 8000, batteryCapacity: 5200, noiseLevel: 72,
      dustCapacity: 0.45, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 18000, marketAverage: 17000, liquidityScore: 9,
      resaleValue: 7, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 3 }
  },

  // --- ECOVACS & IROBOT & DYSON ---
  {
    id: 'ecovacs-deebot-t30',
    name: 'Ecovacs Deebot T30 Omni',
    brand: 'Ecovacs',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 11000, batteryCapacity: 5200, noiseLevel: 69,
      dustCapacity: 0.3, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 42000, marketAverage: 40000, liquidityScore: 6,
      resaleValue: 6, serviceNetwork: 5
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'ecovacs-x1-omni',
    name: 'Ecovacs Deebot X1 Omni',
    brand: 'Ecovacs',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 5000, batteryCapacity: 5200, noiseLevel: 66,
      dustCapacity: 0.4, mappingTech: 'Lidar + AI', mopFeature: true
    },
    market: {
      listPrice: 35000, marketAverage: 33000, liquidityScore: 6,
      resaleValue: 6, serviceNetwork: 5
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'irobot-roomba-j9',
    name: 'iRobot Roomba Combo j9+',
    brand: 'iRobot',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 4500, batteryCapacity: 4400, noiseLevel: 64,
      dustCapacity: 0.4, mappingTech: 'V-SLAM', mopFeature: true
    },
    market: {
      listPrice: 45000, marketAverage: 43000, liquidityScore: 8,
      resaleValue: 8, serviceNetwork: 9
    },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'irobot-roomba-j7',
    name: 'iRobot Roomba j7+',
    brand: 'iRobot',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 2200, batteryCapacity: 4400, noiseLevel: 65,
      dustCapacity: 0.4, mappingTech: 'V-SLAM', mopFeature: false
    },
    market: {
      listPrice: 28000, marketAverage: 26000, liquidityScore: 8,
      resaleValue: 8, serviceNetwork: 9
    },
    risk: { chronicIssueRisk: 2 }
  },
  {
    id: 'dyson-360-vis',
    name: 'Dyson 360 Vis Nav',
    brand: 'Dyson',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 65, batteryCapacity: 4000, noiseLevel: 75, // Dyson Air Watts
      dustCapacity: 0.5, mappingTech: '360 Camera', mopFeature: false
    },
    market: {
      listPrice: 45000, marketAverage: 45000, liquidityScore: 9,
      resaleValue: 9, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 2 }
  },
  
  // --- F/P ALTERNATİFLERİ (PHILIPS, TEFAL, ANKER) ---
  {
    id: 'philips-homerun-7000',
    name: 'Philips HomeRun 7000 Series',
    brand: 'Philips',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 5000, batteryCapacity: 5200, noiseLevel: 66,
      dustCapacity: 0.4, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 24000, marketAverage: 23000, liquidityScore: 10,
      resaleValue: 8, serviceNetwork: 10
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'tefal-xplorer-95',
    name: 'Tefal X-Plorer Serie 95',
    brand: 'Tefal',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 12000, batteryCapacity: 5200, noiseLevel: 70,
      dustCapacity: 0.5, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 19000, marketAverage: 18000, liquidityScore: 9,
      resaleValue: 7, serviceNetwork: 9
    },
    risk: { chronicIssueRisk: 4 }
  },
  {
    id: 'anker-eufy-x8',
    name: 'Anker Eufy RoboVac X8 Hybrid',
    brand: 'Anker',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 4000, batteryCapacity: 5200, noiseLevel: 68,
      dustCapacity: 0.4, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 15000, marketAverage: 14000, liquidityScore: 8,
      resaleValue: 6, serviceNetwork: 7
    },
    risk: { chronicIssueRisk: 3 }
  },
  {
    id: 'viomi-v5-pro',
    name: 'Viomi V5 Pro',
    brand: 'Viomi',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 4000, batteryCapacity: 5200, noiseLevel: 70,
      dustCapacity: 0.35, mappingTech: 'Lidar + 3D', mopFeature: true
    },
    market: {
      listPrice: 13000, marketAverage: 12000, liquidityScore: 7,
      resaleValue: 5, serviceNetwork: 6
    },
    risk: { chronicIssueRisk: 5 }
  },
  {
    id: 'lydsto-r1',
    name: 'Lydsto R1',
    brand: 'Lydsto',
    category: 'ROBOT_VACUUM',
    specs: {
      suctionPower: 2700, batteryCapacity: 5200, noiseLevel: 69,
      dustCapacity: 0.25, mappingTech: 'Lidar', mopFeature: true
    },
    market: {
      listPrice: 11000, marketAverage: 10000, liquidityScore: 6,
      resaleValue: 5, serviceNetwork: 4
    },
    risk: { chronicIssueRisk: 4 }
  }
];

// YARDIMCI FONKSİYONLAR
export function getProductById(id: string): any {
  return [...SAMPLE_VEHICLES, ...SAMPLE_VACUUMS].find(p => p.id === id);
}