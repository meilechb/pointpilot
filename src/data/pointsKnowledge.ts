// Comprehensive points & miles knowledge base
// Used by the AI optimizer to find optimal booking strategies
// Does NOT duplicate transferPartners.ts (which covers bank-to-partner transfer ratios)

// ============================================================
// SECTION 1: Airline Loyalty Programs
// ============================================================
export type AirlineProgram = {
  programName: string
  airline: string
  iataCode: string
  alliance: 'Star Alliance' | 'oneworld' | 'SkyTeam' | 'none'
  currency: string
  operatingCodes: string[]
}

export const airlinePrograms: AirlineProgram[] = [
  // ── Star Alliance ──
  { programName: 'United MileagePlus', airline: 'United Airlines', iataCode: 'UA', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['UA'] },
  { programName: 'Air Canada Aeroplan', airline: 'Air Canada', iataCode: 'AC', alliance: 'Star Alliance', currency: 'points', operatingCodes: ['AC'] },
  { programName: 'ANA Mileage Club', airline: 'ANA', iataCode: 'NH', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['NH'] },
  { programName: 'Avianca LifeMiles', airline: 'Avianca', iataCode: 'AV', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['AV'] },
  { programName: 'Singapore Airlines KrisFlyer', airline: 'Singapore Airlines', iataCode: 'SQ', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['SQ'] },
  { programName: 'Turkish Airlines Miles&Smiles', airline: 'Turkish Airlines', iataCode: 'TK', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['TK'] },
  { programName: 'Lufthansa Miles & More', airline: 'Lufthansa', iataCode: 'LH', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['LH'] },
  { programName: 'SWISS Miles & More', airline: 'SWISS', iataCode: 'LX', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['LX'] },
  { programName: 'Austrian Miles & More', airline: 'Austrian Airlines', iataCode: 'OS', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['OS'] },
  { programName: 'TAP Portugal Miles&Go', airline: 'TAP Air Portugal', iataCode: 'TP', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['TP'] },
  { programName: 'EVA Air Infinity MileageLands', airline: 'EVA Air', iataCode: 'BR', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['BR'] },
  { programName: 'Asiana Airlines', airline: 'Asiana Airlines', iataCode: 'OZ', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['OZ'] },
  { programName: 'Aegean Miles+Bonus', airline: 'Aegean Airlines', iataCode: 'A3', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['A3'] },
  { programName: 'Copa Airlines ConnectMiles', airline: 'Copa Airlines', iataCode: 'CM', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['CM'] },
  { programName: 'Ethiopian Airlines ShebaMiles', airline: 'Ethiopian Airlines', iataCode: 'ET', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['ET'] },
  { programName: 'Air India Flying Returns', airline: 'Air India', iataCode: 'AI', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['AI'] },
  { programName: 'Air China PhoenixMiles', airline: 'Air China', iataCode: 'CA', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['CA'] },
  { programName: 'Air New Zealand Airpoints', airline: 'Air New Zealand', iataCode: 'NZ', alliance: 'Star Alliance', currency: 'dollars', operatingCodes: ['NZ'] },
  { programName: 'South African Airways Voyager', airline: 'South African Airways', iataCode: 'SA', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['SA'] },
  { programName: 'SAS EuroBonus', airline: 'SAS', iataCode: 'SK', alliance: 'Star Alliance', currency: 'points', operatingCodes: ['SK'] },
  { programName: 'LOT Polish Miles', airline: 'LOT Polish Airlines', iataCode: 'LO', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['LO'] },
  { programName: 'EgyptAir Plus', airline: 'EgyptAir', iataCode: 'MS', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['MS'] },
  { programName: 'Brussels Airlines Miles & More', airline: 'Brussels Airlines', iataCode: 'SN', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['SN'] },
  { programName: 'Shenzhen Airlines', airline: 'Shenzhen Airlines', iataCode: 'ZH', alliance: 'Star Alliance', currency: 'miles', operatingCodes: ['ZH'] },

  // ── oneworld ──
  { programName: 'American Airlines AAdvantage', airline: 'American Airlines', iataCode: 'AA', alliance: 'oneworld', currency: 'miles', operatingCodes: ['AA'] },
  { programName: 'British Airways Executive Club', airline: 'British Airways', iataCode: 'BA', alliance: 'oneworld', currency: 'Avios', operatingCodes: ['BA'] },
  { programName: 'Cathay Pacific Asia Miles', airline: 'Cathay Pacific', iataCode: 'CX', alliance: 'oneworld', currency: 'miles', operatingCodes: ['CX'] },
  { programName: 'Qantas Frequent Flyer', airline: 'Qantas', iataCode: 'QF', alliance: 'oneworld', currency: 'points', operatingCodes: ['QF'] },
  { programName: 'Qatar Airways Privilege Club', airline: 'Qatar Airways', iataCode: 'QR', alliance: 'oneworld', currency: 'Avios', operatingCodes: ['QR'] },
  { programName: 'Iberia Plus', airline: 'Iberia', iataCode: 'IB', alliance: 'oneworld', currency: 'Avios', operatingCodes: ['IB'] },
  { programName: 'Japan Airlines Mileage Bank', airline: 'Japan Airlines', iataCode: 'JL', alliance: 'oneworld', currency: 'miles', operatingCodes: ['JL'] },
  { programName: 'Finnair Plus', airline: 'Finnair', iataCode: 'AY', alliance: 'oneworld', currency: 'points', operatingCodes: ['AY'] },
  { programName: 'Alaska Airlines Mileage Plan', airline: 'Alaska Airlines', iataCode: 'AS', alliance: 'oneworld', currency: 'miles', operatingCodes: ['AS'] },
  { programName: 'Royal Air Maroc Safar Flyer', airline: 'Royal Air Maroc', iataCode: 'AT', alliance: 'oneworld', currency: 'miles', operatingCodes: ['AT'] },
  { programName: 'Malaysia Airlines Enrich', airline: 'Malaysia Airlines', iataCode: 'MH', alliance: 'oneworld', currency: 'miles', operatingCodes: ['MH'] },
  { programName: 'Royal Jordanian Royal Club', airline: 'Royal Jordanian', iataCode: 'RJ', alliance: 'oneworld', currency: 'miles', operatingCodes: ['RJ'] },
  { programName: 'SriLankan FlySmiLes', airline: 'SriLankan Airlines', iataCode: 'UL', alliance: 'oneworld', currency: 'miles', operatingCodes: ['UL'] },
  { programName: 'Fiji Airways', airline: 'Fiji Airways', iataCode: 'FJ', alliance: 'oneworld', currency: 'miles', operatingCodes: ['FJ'] },
  { programName: 'Oman Air Sindbad', airline: 'Oman Air', iataCode: 'WY', alliance: 'oneworld', currency: 'miles', operatingCodes: ['WY'] },

  // ── SkyTeam ──
  { programName: 'Delta SkyMiles', airline: 'Delta Air Lines', iataCode: 'DL', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['DL'] },
  { programName: 'Air France-KLM Flying Blue', airline: 'Air France / KLM', iataCode: 'AF', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['AF', 'KL'] },
  { programName: 'Korean Air SKYPASS', airline: 'Korean Air', iataCode: 'KE', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['KE'] },
  { programName: 'Aeromexico Rewards', airline: 'Aeromexico', iataCode: 'AM', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['AM'] },
  { programName: 'Vietnam Airlines Lotusmiles', airline: 'Vietnam Airlines', iataCode: 'VN', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['VN'] },
  { programName: 'China Airlines Dynasty Flyer', airline: 'China Airlines', iataCode: 'CI', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['CI'] },
  { programName: 'China Southern Sky Pearl Club', airline: 'China Southern', iataCode: 'CZ', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['CZ'] },
  { programName: 'China Eastern Miles', airline: 'China Eastern', iataCode: 'MU', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['MU'] },
  { programName: 'Garuda Indonesia GarudaMiles', airline: 'Garuda Indonesia', iataCode: 'GA', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['GA'] },
  { programName: 'Saudia Alfursan', airline: 'Saudia', iataCode: 'SV', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['SV'] },
  { programName: 'Middle East Airlines Cedar Miles', airline: 'MEA', iataCode: 'ME', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['ME'] },
  { programName: 'Czech Airlines OK Plus', airline: 'Czech Airlines', iataCode: 'OK', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['OK'] },
  { programName: 'TAROM Flying Blue', airline: 'TAROM', iataCode: 'RO', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['RO'] },
  { programName: 'ITA Airways Volare', airline: 'ITA Airways', iataCode: 'AZ', alliance: 'SkyTeam', currency: 'points', operatingCodes: ['AZ'] },
  { programName: 'Kenya Airways Asante', airline: 'Kenya Airways', iataCode: 'KQ', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['KQ'] },
  { programName: 'XiamenAir', airline: 'Xiamen Airlines', iataCode: 'MF', alliance: 'SkyTeam', currency: 'miles', operatingCodes: ['MF'] },

  // ── Non-Alliance ──
  { programName: 'Emirates Skywards', airline: 'Emirates', iataCode: 'EK', alliance: 'none', currency: 'miles', operatingCodes: ['EK'] },
  { programName: 'Etihad Guest', airline: 'Etihad Airways', iataCode: 'EY', alliance: 'none', currency: 'miles', operatingCodes: ['EY'] },
  { programName: 'JetBlue TrueBlue', airline: 'JetBlue', iataCode: 'B6', alliance: 'none', currency: 'points', operatingCodes: ['B6'] },
  { programName: 'Southwest Rapid Rewards', airline: 'Southwest Airlines', iataCode: 'WN', alliance: 'none', currency: 'points', operatingCodes: ['WN'] },
  { programName: 'Aer Lingus AerClub', airline: 'Aer Lingus', iataCode: 'EI', alliance: 'none', currency: 'Avios', operatingCodes: ['EI'] },
  { programName: 'Virgin Atlantic Flying Club', airline: 'Virgin Atlantic', iataCode: 'VS', alliance: 'none', currency: 'points', operatingCodes: ['VS'] },
  { programName: 'Spirit Airlines Free Spirit', airline: 'Spirit Airlines', iataCode: 'NK', alliance: 'none', currency: 'points', operatingCodes: ['NK'] },
  { programName: 'Hawaiian Airlines HawaiianMiles', airline: 'Hawaiian Airlines', iataCode: 'HA', alliance: 'none', currency: 'miles', operatingCodes: ['HA'] },
  { programName: 'Frontier Miles', airline: 'Frontier Airlines', iataCode: 'F9', alliance: 'none', currency: 'miles', operatingCodes: ['F9'] },
  { programName: 'LATAM Pass', airline: 'LATAM Airlines', iataCode: 'LA', alliance: 'none', currency: 'miles', operatingCodes: ['LA'] },
  { programName: 'Icelandair Saga Club', airline: 'Icelandair', iataCode: 'FI', alliance: 'none', currency: 'points', operatingCodes: ['FI'] },
]


// ============================================================
// SECTION 2: Alliances
// ============================================================
export type Alliance = {
  name: string
  members: string[] // IATA codes
  bookingRule: string
}

export const alliances: Alliance[] = [
  {
    name: 'Star Alliance',
    members: ['UA', 'AC', 'NH', 'AV', 'SQ', 'TK', 'LH', 'LX', 'OS', 'TP', 'BR', 'OZ', 'A3', 'CM', 'ET', 'AI', 'CA', 'NZ', 'SA', 'SK', 'LO', 'MS', 'SN', 'ZH'],
    bookingRule: 'Any Star Alliance member miles can book flights on any other Star Alliance carrier',
  },
  {
    name: 'oneworld',
    members: ['AA', 'BA', 'CX', 'QF', 'QR', 'IB', 'JL', 'AY', 'AS', 'AT', 'MH', 'RJ', 'UL', 'FJ', 'WY'],
    bookingRule: 'Any oneworld member miles can book flights on any other oneworld carrier',
  },
  {
    name: 'SkyTeam',
    members: ['DL', 'AF', 'KL', 'KE', 'AM', 'VN', 'CI', 'CZ', 'MU', 'GA', 'SV', 'ME', 'OK', 'RO', 'AZ', 'KQ', 'MF'],
    bookingRule: 'Any SkyTeam member miles can book flights on any other SkyTeam carrier',
  },
]


// ============================================================
// SECTION 3: Booking Portals (bank card travel portals)
// ============================================================
export type BookingPortal = {
  id: string
  name: string
  bankProgram: string // matches transferPartners.ts program id
  centsPerPoint: number
  premiumCentsPerPoint?: number
  premiumCardName?: string
  notes: string
}

export const bookingPortals: BookingPortal[] = [
  {
    id: 'chase_travel',
    name: 'Chase Travel Portal',
    bankProgram: 'chase_ur',
    centsPerPoint: 1.25,
    premiumCentsPerPoint: 1.5,
    premiumCardName: 'Chase Sapphire Reserve',
    notes: 'Book any flight at 1.25-1.5 cpp. Good fallback when transfer partners don\'t offer better value.',
  },
  {
    id: 'amex_travel',
    name: 'Amex Travel',
    bankProgram: 'amex_mr',
    centsPerPoint: 1.0,
    premiumCentsPerPoint: 1.0,
    premiumCardName: 'Amex Platinum',
    notes: 'Book flights at 1 cpp. Generally better to transfer to partners for higher value.',
  },
  {
    id: 'capital_one_travel',
    name: 'Capital One Travel',
    bankProgram: 'capital_one',
    centsPerPoint: 1.0,
    notes: 'Book at 1 cpp. Can also erase travel purchases. Transfer to partners usually yields better value.',
  },
  {
    id: 'citi_travel',
    name: 'Citi Travel',
    bankProgram: 'citi_typ',
    centsPerPoint: 1.0,
    premiumCentsPerPoint: 1.25,
    premiumCardName: 'Citi Strata Premier',
    notes: 'Book at 1-1.25 cpp depending on card.',
  },
  {
    id: 'bilt_travel',
    name: 'Bilt Travel',
    bankProgram: 'bilt',
    centsPerPoint: 1.25,
    notes: 'Book through Bilt portal at 1.25 cpp. Transfer to partners usually gives better value.',
  },
]


// ============================================================
// SECTION 4: Partner Booking Rules
// Which miles programs can book on which airlines (beyond basic alliance rules)
// ============================================================
export type PartnerBookingRule = {
  programName: string
  canBookOn: string[] // IATA codes
  notes: string
}

export const partnerBookingRules: PartnerBookingRule[] = [
  {
    programName: 'United MileagePlus',
    canBookOn: ['UA', 'AC', 'NH', 'LH', 'SQ', 'TK', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'AV', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO'],
    notes: 'All Star Alliance partners. No close-in booking fees. Excelsior awards available.',
  },
  {
    programName: 'Air Canada Aeroplan',
    canBookOn: ['AC', 'UA', 'NH', 'LH', 'SQ', 'TK', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'AV', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO', 'EY', 'EK', 'AZ'],
    notes: 'Star Alliance plus Etihad, Emirates (limited), and ITA Airways as non-alliance partners. Mixed-cabin awards allow premium savings.',
  },
  {
    programName: 'ANA Mileage Club',
    canBookOn: ['NH', 'UA', 'AC', 'LH', 'SQ', 'TK', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'AV', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO'],
    notes: 'Star Alliance partners. Round-trip booking required for award tickets. Great value for first class.',
  },
  {
    programName: 'Avianca LifeMiles',
    canBookOn: ['AV', 'UA', 'AC', 'NH', 'LH', 'SQ', 'TK', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO'],
    notes: 'Star Alliance. No fuel surcharges on most partners. One-way awards available.',
  },
  {
    programName: 'American Airlines AAdvantage',
    canBookOn: ['AA', 'BA', 'CX', 'QF', 'QR', 'IB', 'JL', 'AY', 'AS', 'AT', 'MH', 'RJ', 'UL', 'FJ', 'WY', 'EY', 'EI'],
    notes: 'All oneworld partners plus Etihad and Aer Lingus. Web specials can be great value.',
  },
  {
    programName: 'British Airways Executive Club',
    canBookOn: ['BA', 'AA', 'CX', 'QF', 'QR', 'IB', 'JL', 'AY', 'AS', 'AT', 'MH', 'RJ', 'UL', 'FJ', 'WY', 'EI'],
    notes: 'Avios are distance-based. Great for short-haul flights under 1,150 miles. Shared Avios with Iberia, Aer Lingus, Qatar.',
  },
  {
    programName: 'Alaska Airlines Mileage Plan',
    canBookOn: ['AS', 'AA', 'BA', 'CX', 'QF', 'JL', 'AY', 'FJ', 'IB', 'QR', 'EK', 'EI', 'SQ', 'KE', 'FI'],
    notes: 'oneworld plus non-alliance partners (Emirates, Singapore, Korean Air, Icelandair). Generous partner charts for CX, JL, EK.',
  },
  {
    programName: 'Cathay Pacific Asia Miles',
    canBookOn: ['CX', 'AA', 'BA', 'QF', 'QR', 'IB', 'JL', 'AY', 'AS', 'AT', 'MH', 'RJ', 'UL', 'FJ', 'WY'],
    notes: 'oneworld partners. Distance-based chart. Good value for short/medium haul.',
  },
  {
    programName: 'Virgin Atlantic Flying Club',
    canBookOn: ['VS', 'DL', 'AF', 'KL', 'NH'],
    notes: 'Key sweet spot: Transfer Chase/Amex to VS and book ANA business class at great rates. Also books Delta and Air France/KLM.',
  },
  {
    programName: 'Air France-KLM Flying Blue',
    canBookOn: ['AF', 'KL', 'DL', 'KE', 'AM', 'VN', 'CI', 'CZ', 'MU', 'SV', 'ME', 'OK', 'RO', 'GA', 'KQ', 'MF', 'AZ'],
    notes: 'All SkyTeam partners. Monthly promo awards with 25-50% off. Good for Europe flights.',
  },
  {
    programName: 'Delta SkyMiles',
    canBookOn: ['DL', 'AF', 'KL', 'KE', 'AM', 'VN', 'VS', 'LA', 'AZ'],
    notes: 'Dynamic pricing, no award chart. Partner awards can be good value. Virgin Atlantic and LATAM as close partners.',
  },
  {
    programName: 'Korean Air SKYPASS',
    canBookOn: ['KE', 'DL', 'AF', 'KL', 'AM', 'VN', 'CI', 'CZ', 'MU', 'GA', 'SV', 'ME', 'OK', 'RO', 'KQ', 'MF', 'AZ'],
    notes: 'SkyTeam partners. Good value for first class on their own metal and partner awards.',
  },
  {
    programName: 'Emirates Skywards',
    canBookOn: ['EK', 'QF', 'JL', 'KE'],
    notes: 'Limited partners despite not being in an alliance. Can book on Qantas, JAL, Korean Air.',
  },
  {
    programName: 'Etihad Guest',
    canBookOn: ['EY', 'AA', 'AC', 'AZ', 'BA', 'BR', 'CX', 'IB', 'JL', 'KE', 'QF', 'SQ', 'TK', 'VS'],
    notes: 'Wide range of non-alliance partners across all three alliances.',
  },
  {
    programName: 'Turkish Airlines Miles&Smiles',
    canBookOn: ['TK', 'UA', 'AC', 'NH', 'LH', 'SQ', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'AV', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO'],
    notes: 'Star Alliance. Business class US-Europe for 45,000 miles one-way is a sweet spot.',
  },
  {
    programName: 'Singapore Airlines KrisFlyer',
    canBookOn: ['SQ', 'UA', 'AC', 'NH', 'LH', 'TK', 'BR', 'LX', 'TP', 'OZ', 'A3', 'ET', 'SK', 'AV', 'CM', 'NZ', 'SA', 'AI', 'CA', 'SN', 'OS', 'MS', 'ZH', 'LO', 'VS'],
    notes: 'Star Alliance plus Virgin Atlantic. Required for booking SQ Suites (cannot use other Star Alliance miles for Suites).',
  },
  {
    programName: 'Qatar Airways Privilege Club',
    canBookOn: ['QR', 'AA', 'BA', 'CX', 'QF', 'IB', 'JL', 'AY', 'AS', 'AT', 'MH', 'RJ', 'UL', 'FJ', 'WY'],
    notes: 'oneworld partners. Avios-based program. Qsuites business class is among the world\'s best.',
  },
]


// ============================================================
// SECTION 5: Point Valuations (commonly accepted baseline values)
// ============================================================
export type PointValuation = {
  program: string
  centsPerPoint: number
  sweetSpotRange: [number, number]
  notes: string
}

export const pointValuations: PointValuation[] = [
  // Bank programs
  { program: 'Chase Ultimate Rewards', centsPerPoint: 2.0, sweetSpotRange: [1.5, 2.5],
    notes: 'Best transferred to Hyatt (hotels) or airline partners. Portal gives 1.25-1.5 cpp.' },
  { program: 'Amex Membership Rewards', centsPerPoint: 2.0, sweetSpotRange: [1.5, 2.5],
    notes: 'Great flexibility with 17+ airline partners. ANA via Virgin Atlantic is a top sweet spot.' },
  { program: 'Citi ThankYou Points', centsPerPoint: 1.8, sweetSpotRange: [1.2, 2.2],
    notes: 'Only major bank program that transfers to American Airlines. Turkish is another strong option.' },
  { program: 'Capital One Miles', centsPerPoint: 1.7, sweetSpotRange: [1.2, 2.0],
    notes: 'Wide partner list. Can erase travel purchases at 1 cpp as a fallback.' },
  { program: 'Bilt Rewards', centsPerPoint: 1.8, sweetSpotRange: [1.5, 2.2],
    notes: 'Earned from rent. 1:1 transfer to Hyatt and many airline partners.' },

  // Airline programs
  { program: 'United MileagePlus', centsPerPoint: 1.2, sweetSpotRange: [1.0, 1.8],
    notes: 'Dynamic pricing. Partner awards often better value than saver awards on UA metal.' },
  { program: 'American Airlines AAdvantage', centsPerPoint: 1.4, sweetSpotRange: [1.0, 2.0],
    notes: 'Web specials can be great. Partner awards on JAL, CX, QR business/first are sweet spots.' },
  { program: 'Delta SkyMiles', centsPerPoint: 1.1, sweetSpotRange: [0.8, 1.5],
    notes: 'Dynamic pricing, values vary widely. Flash sales and SkyMiles Deals can be excellent.' },
  { program: 'Southwest Rapid Rewards', centsPerPoint: 1.3, sweetSpotRange: [1.2, 1.5],
    notes: 'Fixed value ~1.3 cpp. No blackout dates. Companion Pass doubles value.' },
  { program: 'British Airways Avios', centsPerPoint: 1.3, sweetSpotRange: [1.0, 2.5],
    notes: 'Distance-based chart. Under 1,150 miles = 7,500 Avios one-way. Great for AA short-haul.' },
  { program: 'Alaska Airlines Mileage Plan', centsPerPoint: 1.5, sweetSpotRange: [1.2, 3.0],
    notes: 'Partner award charts are public and generous. CX, JL, EK first class sweet spots.' },
  { program: 'Air France-KLM Flying Blue', centsPerPoint: 1.2, sweetSpotRange: [1.0, 2.0],
    notes: 'Monthly promo awards offer 25-50% off. Europe awards are solid value.' },
  { program: 'Virgin Atlantic Flying Club', centsPerPoint: 1.4, sweetSpotRange: [1.0, 3.0],
    notes: 'ANA business class roundtrip for 90-120K points is the top sweet spot. Delta awards too.' },
  { program: 'Singapore Airlines KrisFlyer', centsPerPoint: 1.5, sweetSpotRange: [1.2, 2.5],
    notes: 'Required for booking SQ Suites. Star Alliance partner awards available.' },
  { program: 'Cathay Pacific Asia Miles', centsPerPoint: 1.3, sweetSpotRange: [1.0, 2.5],
    notes: 'Distance-based chart. Good value for oneworld partners on short/medium haul.' },
  { program: 'Air Canada Aeroplan', centsPerPoint: 1.5, sweetSpotRange: [1.2, 2.5],
    notes: 'Competitive partner pricing. Mixed-cabin awards. Etihad and Emirates as non-alliance partners.' },
  { program: 'Turkish Airlines Miles&Smiles', centsPerPoint: 1.5, sweetSpotRange: [1.0, 3.0],
    notes: 'Business class US-Europe for 45K one-way. Star Alliance partner awards.' },
  { program: 'Avianca LifeMiles', centsPerPoint: 1.2, sweetSpotRange: [1.0, 2.0],
    notes: 'No fuel surcharges on Star Alliance partners. Often cheapest Star Alliance award pricing.' },
  { program: 'JetBlue TrueBlue', centsPerPoint: 1.3, sweetSpotRange: [1.0, 1.6],
    notes: 'Revenue-based. Best value on JetBlue Mint (business class) transcontinental flights.' },
  { program: 'Emirates Skywards', centsPerPoint: 1.0, sweetSpotRange: [0.7, 2.0],
    notes: 'First class on Emirates A380 is the aspirational redemption. Economy redemptions are poor value.' },
  { program: 'Etihad Guest', centsPerPoint: 1.2, sweetSpotRange: [0.8, 2.0],
    notes: 'Best value on their own premium cabin flights. Wide range of partner airlines.' },
]


// ============================================================
// SECTION 6: Sweet Spots
// ============================================================
export type SweetSpot = {
  title: string
  programs: string[]
  routes: string
  estimatedValue: string
  description: string
}

export const sweetSpots: SweetSpot[] = [
  {
    title: 'ANA Business Class via Virgin Atlantic',
    programs: ['Virgin Atlantic Flying Club', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'],
    routes: 'US to Japan roundtrip',
    estimatedValue: '3-5 cpp',
    description: 'Transfer Chase, Amex, or Bilt to Virgin Atlantic. Book ANA business class roundtrip for 90,000-120,000 points. One of the best sweet spots in award travel.',
  },
  {
    title: 'British Airways Avios Short-Haul on AA',
    programs: ['British Airways Executive Club', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'],
    routes: 'US domestic under 1,150 miles',
    estimatedValue: '2-4 cpp',
    description: 'Book American Airlines domestic flights using BA Avios for 7,500 points one-way in economy on flights under 1,150 miles. Transfer from Chase, Amex, or Bilt.',
  },
  {
    title: 'Turkish Miles&Smiles Business Class to Europe',
    programs: ['Turkish Airlines Miles&Smiles', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'],
    routes: 'US to Europe/Turkey',
    estimatedValue: '2-4 cpp',
    description: 'Transfer Citi, Capital One, or Bilt to Turkish. Book Star Alliance business class to Europe for 45,000 miles one-way.',
  },
  {
    title: 'Flying Blue Promo Awards to Europe',
    programs: ['Air France-KLM Flying Blue', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'],
    routes: 'US to Europe',
    estimatedValue: '2-3 cpp',
    description: 'Monthly promo awards on Air France/KLM with 25-50% off. Economy US-Europe can go as low as 17,000 miles one-way.',
  },
  {
    title: 'Aeroplan on Star Alliance Partners',
    programs: ['Air Canada Aeroplan', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Capital One Miles', 'Bilt Rewards'],
    routes: 'Worldwide on Star Alliance',
    estimatedValue: '2-3 cpp',
    description: 'Aeroplan has competitive partner award pricing plus Etihad/Emirates as bonus partners. Mixed-cabin awards allow premium savings.',
  },
  {
    title: 'Alaska Mileage Plan on Cathay/JAL First Class',
    programs: ['Alaska Airlines Mileage Plan', 'Bilt Rewards'],
    routes: 'US to Asia',
    estimatedValue: '3-6 cpp',
    description: 'Alaska has generous partner charts. Cathay Pacific first class 70K one-way, JAL business 60K one-way US to Asia.',
  },
  {
    title: 'Chase Portal with Sapphire Reserve',
    programs: ['Chase Ultimate Rewards'],
    routes: 'Any flight (fallback strategy)',
    estimatedValue: '1.5 cpp',
    description: 'When transfer partners don\'t yield better value, book any flight through Chase Travel at 1.5 cpp with the Sapphire Reserve. Simple and no transfer needed.',
  },
  {
    title: 'LifeMiles on Star Alliance (No Fuel Surcharges)',
    programs: ['Avianca LifeMiles', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'],
    routes: 'Worldwide on Star Alliance',
    estimatedValue: '1.5-2.5 cpp',
    description: 'LifeMiles charges no fuel surcharges on most Star Alliance partners. Often the cheapest way to book Lufthansa, Swiss, or ANA.',
  },
  {
    title: 'Emirates First Class via Emirates Skywards',
    programs: ['Emirates Skywards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'],
    routes: 'US to Dubai/Middle East/Asia',
    estimatedValue: '2-4 cpp',
    description: 'Transfer to Emirates Skywards for their iconic A380 first class. The onboard shower and bar make it a bucket list redemption.',
  },
  {
    title: 'Iberia Avios for AA Flights to South America',
    programs: ['Iberia Plus', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'],
    routes: 'US to South America',
    estimatedValue: '2-3 cpp',
    description: 'Iberia Avios can book American Airlines flights to South America at lower rates than AAdvantage. Off-peak pricing available.',
  },
]


// ============================================================
// SECTION 7: Helper Functions
// ============================================================

/** Find an airline program by IATA code */
export function findProgramByIata(iataCode: string): AirlineProgram | undefined {
  return airlinePrograms.find(p =>
    p.iataCode === iataCode || p.operatingCodes.includes(iataCode)
  )
}

/** Find all miles programs that can book on a given airline (by IATA code) */
export function findBookablePrograms(airlineIata: string): string[] {
  const results: string[] = []

  // Direct: the airline's own program
  const ownProgram = findProgramByIata(airlineIata)
  if (ownProgram) results.push(ownProgram.programName)

  // Alliance partners
  for (const alliance of alliances) {
    if (alliance.members.includes(airlineIata)) {
      for (const memberIata of alliance.members) {
        const memberProgram = findProgramByIata(memberIata)
        if (memberProgram && !results.includes(memberProgram.programName)) {
          results.push(memberProgram.programName)
        }
      }
    }
  }

  // Specific partner rules (catches non-alliance partnerships)
  for (const rule of partnerBookingRules) {
    if (rule.canBookOn.includes(airlineIata) && !results.includes(rule.programName)) {
      results.push(rule.programName)
    }
  }

  return results
}

/** Find which portal can book a flight using bank points directly */
export function findPortalOptions(bankProgramId: string): BookingPortal | undefined {
  return bookingPortals.find(p => p.bankProgram === bankProgramId)
}

/** Get valuation for a program */
export function getValuation(programName: string): PointValuation | undefined {
  return pointValuations.find(v =>
    v.program.toLowerCase() === programName.toLowerCase() ||
    programName.toLowerCase().includes(v.program.toLowerCase().split(' ')[0])
  )
}

/** Get sweet spots relevant to a given program */
export function getSweetSpotsForProgram(programName: string): SweetSpot[] {
  return sweetSpots.filter(s =>
    s.programs.some(p => p.toLowerCase().includes(programName.toLowerCase().split(' ')[0]))
  )
}
