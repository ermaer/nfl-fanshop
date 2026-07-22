export interface TeamData {
  name: string;
  city: string;
  abbreviation: string;
  conference: "AFC" | "NFC";
  division: string;
  primaryColor: string;
  secondaryColor: string;
}

export const NFL_TEAMS: TeamData[] = [
  { city: "Buffalo", name: "Bills", abbreviation: "BUF", conference: "AFC", division: "AFC East", primaryColor: "#00338D", secondaryColor: "#C60C30" },
  { city: "Miami", name: "Dolphins", abbreviation: "MIA", conference: "AFC", division: "AFC East", primaryColor: "#008E97", secondaryColor: "#FC4C02" },
  { city: "New England", name: "Patriots", abbreviation: "NE", conference: "AFC", division: "AFC East", primaryColor: "#002244", secondaryColor: "#C60C30" },
  { city: "New York", name: "Jets", abbreviation: "NYJ", conference: "AFC", division: "AFC East", primaryColor: "#125740", secondaryColor: "#FFFFFF" },
  { city: "Baltimore", name: "Ravens", abbreviation: "BAL", conference: "AFC", division: "AFC North", primaryColor: "#241773", secondaryColor: "#9E7C0C" },
  { city: "Cincinnati", name: "Bengals", abbreviation: "CIN", conference: "AFC", division: "AFC North", primaryColor: "#FB4F14", secondaryColor: "#000000" },
  { city: "Cleveland", name: "Browns", abbreviation: "CLE", conference: "AFC", division: "AFC North", primaryColor: "#311D00", secondaryColor: "#FF3C00" },
  { city: "Pittsburgh", name: "Steelers", abbreviation: "PIT", conference: "AFC", division: "AFC North", primaryColor: "#101820", secondaryColor: "#FFB612" },
  { city: "Houston", name: "Texans", abbreviation: "HOU", conference: "AFC", division: "AFC South", primaryColor: "#03202F", secondaryColor: "#A71930" },
  { city: "Indianapolis", name: "Colts", abbreviation: "IND", conference: "AFC", division: "AFC South", primaryColor: "#002C5F", secondaryColor: "#A2AAAD" },
  { city: "Jacksonville", name: "Jaguars", abbreviation: "JAX", conference: "AFC", division: "AFC South", primaryColor: "#006778", secondaryColor: "#D7A22A" },
  { city: "Tennessee", name: "Titans", abbreviation: "TEN", conference: "AFC", division: "AFC South", primaryColor: "#0C2340", secondaryColor: "#4B92DB" },
  { city: "Denver", name: "Broncos", abbreviation: "DEN", conference: "AFC", division: "AFC West", primaryColor: "#FB4F14", secondaryColor: "#002244" },
  { city: "Kansas City", name: "Chiefs", abbreviation: "KC", conference: "AFC", division: "AFC West", primaryColor: "#E31837", secondaryColor: "#FFB81C" },
  { city: "Las Vegas", name: "Raiders", abbreviation: "LV", conference: "AFC", division: "AFC West", primaryColor: "#000000", secondaryColor: "#A5ACAF" },
  { city: "Los Angeles", name: "Chargers", abbreviation: "LAC", conference: "AFC", division: "AFC West", primaryColor: "#0080C6", secondaryColor: "#FFC20E" },
  { city: "Dallas", name: "Cowboys", abbreviation: "DAL", conference: "NFC", division: "NFC East", primaryColor: "#003594", secondaryColor: "#869397" },
  { city: "New York", name: "Giants", abbreviation: "NYG", conference: "NFC", division: "NFC East", primaryColor: "#0B2265", secondaryColor: "#A71930" },
  { city: "Philadelphia", name: "Eagles", abbreviation: "PHI", conference: "NFC", division: "NFC East", primaryColor: "#004C54", secondaryColor: "#A5ACAF" },
  { city: "Washington", name: "Commanders", abbreviation: "WAS", conference: "NFC", division: "NFC East", primaryColor: "#5A1414", secondaryColor: "#FFB612" },
  { city: "Chicago", name: "Bears", abbreviation: "CHI", conference: "NFC", division: "NFC North", primaryColor: "#0B162A", secondaryColor: "#C83803" },
  { city: "Detroit", name: "Lions", abbreviation: "DET", conference: "NFC", division: "NFC North", primaryColor: "#0076B6", secondaryColor: "#B0B7BC" },
  { city: "Green Bay", name: "Packers", abbreviation: "GB", conference: "NFC", division: "NFC North", primaryColor: "#203731", secondaryColor: "#FFB612" },
  { city: "Minnesota", name: "Vikings", abbreviation: "MIN", conference: "NFC", division: "NFC North", primaryColor: "#4F2683", secondaryColor: "#FFC62F" },
  { city: "Atlanta", name: "Falcons", abbreviation: "ATL", conference: "NFC", division: "NFC South", primaryColor: "#A71930", secondaryColor: "#000000" },
  { city: "Carolina", name: "Panthers", abbreviation: "CAR", conference: "NFC", division: "NFC South", primaryColor: "#0085CA", secondaryColor: "#101820" },
  { city: "New Orleans", name: "Saints", abbreviation: "NO", conference: "NFC", division: "NFC South", primaryColor: "#D3BC8D", secondaryColor: "#101820" },
  { city: "Tampa Bay", name: "Buccaneers", abbreviation: "TB", conference: "NFC", division: "NFC South", primaryColor: "#D50A0A", secondaryColor: "#34302B" },
  { city: "Arizona", name: "Cardinals", abbreviation: "ARI", conference: "NFC", division: "NFC West", primaryColor: "#97233F", secondaryColor: "#000000" },
  { city: "Los Angeles", name: "Rams", abbreviation: "LAR", conference: "NFC", division: "NFC West", primaryColor: "#003594", secondaryColor: "#FFA300" },
  { city: "San Francisco", name: "49ers", abbreviation: "SF", conference: "NFC", division: "NFC West", primaryColor: "#AA0000", secondaryColor: "#B3995D" },
  { city: "Seattle", name: "Seahawks", abbreviation: "SEA", conference: "NFC", division: "NFC West", primaryColor: "#002244", secondaryColor: "#69BE28" },
];
