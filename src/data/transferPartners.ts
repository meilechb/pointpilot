// Static transfer partner data for major bank points programs
// Ratio format: [bankPoints, partnerPoints] — e.g. [1000, 800] means 1000 bank pts = 800 partner pts

export type TransferPartner = {
  partner: string
  type: 'airline' | 'hotel'
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
      { partner: 'Aer Lingus AerClub', type: 'airline', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', type: 'airline', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', type: 'airline', ratio: [1, 1] },
      { partner: 'Iberia Plus', type: 'airline', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', type: 'airline', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Southwest Rapid Rewards', type: 'airline', ratio: [1, 1] },
      { partner: 'United MileagePlus', type: 'airline', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', type: 'airline', ratio: [1, 1] },
      { partner: 'IHG One Rewards', type: 'hotel', ratio: [1, 1] },
      { partner: 'Marriott Bonvoy', type: 'hotel', ratio: [1, 1] },
      { partner: 'World of Hyatt', type: 'hotel', ratio: [1, 1] },
    ],
  },
  {
    id: 'amex_mr',
    name: 'Amex Membership Rewards',
    partners: [
      { partner: 'Aer Lingus AerClub', type: 'airline', ratio: [1, 1] },
      { partner: 'Aeromexico Rewards', type: 'airline', ratio: [1000, 1600] },
      { partner: 'Air Canada Aeroplan', type: 'airline', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', type: 'airline', ratio: [1, 1] },
      { partner: 'ANA Mileage Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', type: 'airline', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', type: 'airline', ratio: [1, 1] },
      { partner: 'Delta SkyMiles', type: 'airline', ratio: [1, 1] },
      { partner: 'Emirates Skywards', type: 'airline', ratio: [1000, 800] },
      { partner: 'Etihad Guest', type: 'airline', ratio: [1, 1] },
      { partner: 'Iberia Plus', type: 'airline', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', type: 'airline', ratio: [250, 200] },
      { partner: 'Qantas Frequent Flyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', type: 'airline', ratio: [1, 1] },
    ],
  },
  {
    id: 'citi_typ',
    name: 'Citi ThankYou Points',
    partners: [
      { partner: 'Aeromexico Club Premier', type: 'airline', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', type: 'airline', ratio: [1, 1] },
      { partner: 'American Airlines AAdvantage', type: 'airline', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', type: 'airline', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', type: 'airline', ratio: [1, 1] },
      { partner: 'Emirates Skywards', type: 'airline', ratio: [1000, 800] },
      { partner: 'Etihad Guest', type: 'airline', ratio: [1, 1] },
      { partner: 'EVA Air Infinity MileageLands', type: 'airline', ratio: [1, 1] },
      { partner: 'JetBlue TrueBlue', type: 'airline', ratio: [1, 1] },
      { partner: 'Qantas Frequent Flyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Thai Airways Royal Orchid Plus', type: 'airline', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', type: 'airline', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Accor Live Limitless', type: 'hotel', ratio: [2, 1] },
      { partner: 'Choice Privileges', type: 'hotel', ratio: [1, 2] },
      { partner: 'Wyndham Rewards', type: 'hotel', ratio: [1, 1] },
    ],
  },
  {
    id: 'capital_one',
    name: 'Capital One Miles',
    partners: [
      { partner: 'Aeromexico Rewards', type: 'airline', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', type: 'airline', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', type: 'airline', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', type: 'airline', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', type: 'airline', ratio: [1, 1] },
      { partner: 'Emirates Skywards', type: 'airline', ratio: [1, 1] },
      { partner: 'Etihad Guest', type: 'airline', ratio: [1, 1] },
      { partner: 'EVA Air Infinity MileageLands', type: 'airline', ratio: [4, 3] },
      { partner: 'Finnair Plus', type: 'airline', ratio: [1, 1] },
      { partner: 'Japan Airlines Mileage Bank', type: 'airline', ratio: [4, 3] },
      { partner: 'JetBlue TrueBlue', type: 'airline', ratio: [5, 3] },
      { partner: 'Qantas Frequent Flyer', type: 'airline', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Singapore Airlines KrisFlyer', type: 'airline', ratio: [1, 1] },
      { partner: 'TAP Portugal Miles&Go', type: 'airline', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', type: 'airline', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Accor Live Limitless', type: 'hotel', ratio: [2, 1] },
      { partner: 'Choice Privileges', type: 'hotel', ratio: [1, 1] },
      { partner: 'Wyndham Rewards', type: 'hotel', ratio: [1, 1] },
    ],
  },
  {
    id: 'bilt',
    name: 'Bilt Rewards',
    partners: [
      { partner: 'Aer Lingus AerClub', type: 'airline', ratio: [1, 1] },
      { partner: 'Air Canada Aeroplan', type: 'airline', ratio: [1, 1] },
      { partner: 'Air France-KLM Flying Blue', type: 'airline', ratio: [1, 1] },
      { partner: 'Alaska Airlines Mileage Plan', type: 'airline', ratio: [1, 1] },
      { partner: 'Avianca LifeMiles', type: 'airline', ratio: [1, 1] },
      { partner: 'British Airways Executive Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Cathay Pacific Asia Miles', type: 'airline', ratio: [1, 1] },
      { partner: 'Emirates Skywards', type: 'airline', ratio: [1, 1] },
      { partner: 'Etihad Guest', type: 'airline', ratio: [1, 1] },
      { partner: 'Iberia Plus', type: 'airline', ratio: [1, 1] },
      { partner: 'Japan Airlines Mileage Bank', type: 'airline', ratio: [1, 1] },
      { partner: 'Qatar Airways Privilege Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Southwest Rapid Rewards', type: 'airline', ratio: [1, 1] },
      { partner: 'Spirit Airlines Free Spirit', type: 'airline', ratio: [1, 1] },
      { partner: 'TAP Portugal Miles&Go', type: 'airline', ratio: [1, 1] },
      { partner: 'Turkish Airlines Miles&Smiles', type: 'airline', ratio: [1, 1] },
      { partner: 'United MileagePlus', type: 'airline', ratio: [1, 1] },
      { partner: 'Virgin Atlantic Flying Club', type: 'airline', ratio: [1, 1] },
      { partner: 'Accor Live Limitless', type: 'hotel', ratio: [3, 2] },
      { partner: 'Hilton Honors', type: 'hotel', ratio: [1, 1] },
      { partner: 'IHG One Rewards', type: 'hotel', ratio: [1, 1] },
      { partner: 'Marriott Bonvoy', type: 'hotel', ratio: [1, 1] },
      { partner: 'World of Hyatt', type: 'hotel', ratio: [1, 1] },
    ],
  },
]

// Helper: find which programs can transfer to a given airline/hotel
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
