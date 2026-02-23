// Static transfer partner data for major bank points programs
// Ratio format: [bankPoints, partnerPoints] — e.g. [1000, 800] means 1000 bank pts = 800 partner pts

export type TransferPartner = {
  partner: string
  ratio: [number, number] // [bankPoints, partnerPoints]
}

export type PointsProgram = {
  id: string
  name: string
  partners: TransferPartner[]
}

export const transferPartners: PointsProgram[] = [
  {
    id: 'chase_ur',
    name: 'Chase Ultimate Rewards',
    partners: [
      { partner: 'Aer Lingus AerClub', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', ratio: [1, 1] },
      { partner: 'Iberia Plus', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', ratio: [1, 1] },
      { partner: 'Southwest Rapid Rewards', ratio: [1, 1] },
      { partner: 'United MileagePlus', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', ratio: [1, 1] },
    ],
  },
  {
    id: 'amex_mr',
    name: 'Amex Membership Rewards',
    partners: [
      { partner: 'Aer Lingus AerClub', ratio: [1, 1] },
      { partner: 'Aeromexico Rewards', ratio: [1000, 1600] },
      { partner: 'Air Canada Aeroplan', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', ratio: [1, 1] },
      { partner: 'ANA Mileage Club', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', ratio: [1, 1] },
      { partner: 'Delta SkyMiles', ratio: [1, 1] },
      { partner: 'Emirates Skywards', ratio: [1000, 800] },
      { partner: 'Etihad Guest', ratio: [1, 1] },
      { partner: 'Iberia Plus', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', ratio: [250, 200] },
      { partner: 'Qantas Frequent Flyer', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', ratio: [1, 1] },
    ],
  },
  {
    id: 'citi_typ',
    name: 'Citi ThankYou Points',
    partners: [
      { partner: 'Aeromexico Club Premier', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', ratio: [1, 1] },
      { partner: 'American Airlines AAdvantage', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', ratio: [1, 1] },
      { partner: 'Emirates Skywards', ratio: [1000, 800] },
      { partner: 'Etihad Guest', ratio: [1, 1] },
      { partner: 'EVA Air Infinity MileageLands', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', ratio: [1, 1] },
      { partner: 'Qantas Frequent Flyer', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', ratio: [1, 1] },
      { partner: 'Thai Airways Royal Orchid Plus', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', ratio: [1, 1] },
    ],
  },
  {
    id: 'capital_one',
    name: 'Capital One Miles',
    partners: [
      { partner: 'Aeromexico Rewards', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', ratio: [1, 1] },
      { partner: 'Emirates Skywards', ratio: [1, 1] },
      { partner: 'Etihad Guest', ratio: [1, 1] },
      { partner: 'EVA Air Infinity MileageLands', ratio: [4, 3] },
      { partner: 'Finnair Plus', ratio: [1, 1] },
      { partner: 'Japan Airlines Mileage Bank', ratio: [4, 3] },
      { partner: 'JetBlue TrueBlue', ratio: [5, 3] },
      { partner: 'Qantas Frequent Flyer', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', ratio: [1, 1] },
      { partner: 'TAP Portugal Miles&Go', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', ratio: [1, 1] },
    ],
  },
  {
    id: 'bilt',
    name: 'Bilt Rewards',
    partners: [
      { partner: 'Aer Lingus AerClub', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', ratio: [1, 1] },
      { partner: 'Alaska Airlines Mileage Plan', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', ratio: [1, 1] },
      { partner: 'Emirates Skywards', ratio: [1, 1] },
      { partner: 'Etihad Guest', ratio: [1, 1] },
      { partner: 'Iberia Plus', ratio: [1, 1] },
      { partner: 'Japan Airlines Mileage Bank', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', ratio: [1, 1] },
      { partner: 'Southwest Rapid Rewards', ratio: [1, 1] },
      { partner: 'Spirit Airlines Free Spirit', ratio: [1, 1] },
      { partner: 'TAP Portugal Miles&Go', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', ratio: [1, 1] },
      { partner: 'United MileagePlus', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', ratio: [1, 1] },
    ],
  },
]

// Helper: find which programs can transfer to a given airline
export function findProgramsForPartner(partnerName: string): { program: PointsProgram; partner: TransferPartner }[] {
  const results: { program: PointsProgram; partner: TransferPartner }[] = []
  const search = partnerName.toLowerCase()
  for (const program of transferPartners) {
    for (const p of program.partners) {
      if (p.partner.toLowerCase().includes(search)) {
        results.push({ program, partner: p })
      }
    }
  }
  return results
}

// Helper: get all partners for a given program id
export function getPartnersForProgram(programId: string): TransferPartner[] {
  const program = transferPartners.find(p => p.id === programId)
  return program?.partners || []
}
