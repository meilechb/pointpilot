import airportsData from '@/data/airports.json'

type AirportEntry = [string, string, string, ...string[]]
const airports = airportsData as AirportEntry[]
const airportMap: Record<string, AirportEntry> = {}
airports.forEach(a => { airportMap[a[0]] = a })

const CITY_NAMES: Record<string, string> = {
  JFK: 'New York', EWR: 'Newark', LGA: 'New York',
  LAX: 'Los Angeles', SFO: 'San Francisco', OAK: 'Oakland', SJC: 'San Jose',
  ORD: 'Chicago', MDW: 'Chicago',
  DFW: 'Dallas', DAL: 'Dallas',
  IAH: 'Houston', HOU: 'Houston',
  DCA: 'Washington DC', IAD: 'Washington DC', BWI: 'Baltimore',
  MIA: 'Miami', FLL: 'Fort Lauderdale', PBI: 'West Palm Beach',
  ATL: 'Atlanta', BOS: 'Boston', SEA: 'Seattle', DEN: 'Denver',
  PHX: 'Phoenix', MSP: 'Minneapolis', DTW: 'Detroit', PHL: 'Philadelphia',
  CLT: 'Charlotte', MCO: 'Orlando', TPA: 'Tampa', SAN: 'San Diego',
  PDX: 'Portland', STL: 'St. Louis', BNA: 'Nashville', AUS: 'Austin',
  RDU: 'Raleigh', SLC: 'Salt Lake City', PIT: 'Pittsburgh',
  CLE: 'Cleveland', CMH: 'Columbus', IND: 'Indianapolis', MKE: 'Milwaukee',
  LHR: 'London', LGW: 'London', STN: 'London', LTN: 'London', LCY: 'London',
  CDG: 'Paris', ORY: 'Paris',
  FCO: 'Rome', CIA: 'Rome',
  MXP: 'Milan', LIN: 'Milan',
  BER: 'Berlin', TXL: 'Berlin', SXF: 'Berlin',
  AMS: 'Amsterdam', FRA: 'Frankfurt', MUC: 'Munich', ZRH: 'Zurich',
  VIE: 'Vienna', BCN: 'Barcelona', MAD: 'Madrid', LIS: 'Lisbon',
  ATH: 'Athens', IST: 'Istanbul', SAW: 'Istanbul',
  DUB: 'Dublin', CPH: 'Copenhagen', OSL: 'Oslo', ARN: 'Stockholm', HEL: 'Helsinki',
  WAW: 'Warsaw', PRG: 'Prague', BUD: 'Budapest',
  TLV: 'Tel Aviv', CAI: 'Cairo', CMN: 'Casablanca',
  DXB: 'Dubai', AUH: 'Abu Dhabi', DOH: 'Doha', RUH: 'Riyadh', JED: 'Jeddah',
  AMM: 'Amman', BEY: 'Beirut',
  NRT: 'Tokyo', HND: 'Tokyo', KIX: 'Osaka', ITM: 'Osaka',
  ICN: 'Seoul', GMP: 'Seoul',
  PEK: 'Beijing', PKX: 'Beijing', PVG: 'Shanghai', SHA: 'Shanghai',
  HKG: 'Hong Kong', TPE: 'Taipei',
  SIN: 'Singapore', BKK: 'Bangkok', DMK: 'Bangkok',
  KUL: 'Kuala Lumpur', CGK: 'Jakarta',
  DEL: 'Delhi', BOM: 'Mumbai', MAA: 'Chennai', BLR: 'Bangalore',
  SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane', AKL: 'Auckland',
  GRU: 'São Paulo', GIG: 'Rio de Janeiro', EZE: 'Buenos Aires',
  BOG: 'Bogotá', LIM: 'Lima', SCL: 'Santiago', MEX: 'Mexico City', CUN: 'Cancún',
  YYZ: 'Toronto', YUL: 'Montreal', YVR: 'Vancouver', YOW: 'Ottawa',
  SVO: 'Moscow', DME: 'Moscow', VKO: 'Moscow', LED: 'St. Petersburg',
  JNB: 'Johannesburg', CPT: 'Cape Town', NBO: 'Nairobi', ADD: 'Addis Ababa',
  ACC: 'Accra', LOS: 'Lagos',
}

export function getCityName(iata: string): string {
  if (CITY_NAMES[iata]) return CITY_NAMES[iata]
  const entry = airportMap[iata]
  if (entry) return entry[1]
  return iata
}

export function getAirportName(iata: string): string {
  const entry = airportMap[iata]
  return entry ? entry[1] : iata
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return timeStr
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getLayoverMinutes(seg1: any, seg2: any): number {
  if (seg1.arrivalTimeUtc && seg2.departureTimeUtc) {
    const a = new Date(seg1.arrivalTimeUtc.replace(' ', 'T') + 'Z')
    const d = new Date(seg2.departureTimeUtc.replace(' ', 'T') + 'Z')
    return (d.getTime() - a.getTime()) / 60000
  }
  const arrDate = seg1.arrivalDate || seg1.date
  const depDate = seg2.date
  if (seg1.arrivalTime && seg2.departureTime && arrDate && depDate) {
    const a = new Date(`${arrDate}T${seg1.arrivalTime}`)
    const d = new Date(`${depDate}T${seg2.departureTime}`)
    let diff = (d.getTime() - a.getTime()) / 60000
    if (diff < 0) diff += 24 * 60
    return diff
  }
  return 0
}

export function calculateTotalTime(segments: any[]): string {
  if (segments.length === 0) return ''

  const allHaveDuration = segments.every(s => s.duration && s.duration > 0)
  if (allHaveDuration) {
    let totalMin = segments.reduce((sum: number, s: any) => sum + s.duration, 0)
    for (let i = 0; i < segments.length - 1; i++) {
      const layoverMin = getLayoverMinutes(segments[i], segments[i + 1])
      if (layoverMin > 0) totalMin += layoverMin
    }
    return formatDuration(Math.round(totalMin))
  }

  const first = segments[0]
  const last = segments[segments.length - 1]
  if (first.departureTimeUtc && last.arrivalTimeUtc) {
    const depart = new Date(first.departureTimeUtc.replace(' ', 'T') + 'Z')
    const arrive = new Date(last.arrivalTimeUtc.replace(' ', 'T') + 'Z')
    const diffMin = (arrive.getTime() - depart.getTime()) / 60000
    if (diffMin > 0) return formatDuration(Math.round(diffMin))
  }

  const depDate = first.date
  const arrDate = last.arrivalDate || last.date
  if (depDate && first.departureTime && arrDate && last.arrivalTime) {
    const depart = new Date(`${depDate}T${first.departureTime}`)
    const arrive = new Date(`${arrDate}T${last.arrivalTime}`)
    let diffMin = (arrive.getTime() - depart.getTime()) / 60000
    if (diffMin < 0) diffMin += 24 * 60
    return formatDuration(Math.round(diffMin))
  }

  return ''
}

export function calculateLayovers(segments: any[]): { airport: string; duration: string }[] {
  const layovers: { airport: string; duration: string }[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    const airport = segments[i].arrivalAirport
    const mins = getLayoverMinutes(segments[i], segments[i + 1])
    if (mins > 0) {
      layovers.push({ airport, duration: formatDuration(Math.round(mins)) })
    }
  }
  return layovers
}