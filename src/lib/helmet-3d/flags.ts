/**
 * National flags customers can put on a helmet. The images are from flag-icons
 * (MIT licence), copied into /public/flags.
 *
 * Countries use their two-letter ISO code; the UK's home nations use three letters,
 * because place_order() accepts two or three letters.
 */

export interface HelmetFlag {
  code: string
  name: string
  url: string
}

const flag = (code: string, name: string, file = code): HelmetFlag => ({ code, name, url: `/flags/${file}.svg` })

export const helmetFlags: HelmetFlag[] = [
  flag("gb", "United Kingdom"),
  flag("eng", "England", "gb-eng"),
  flag("sct", "Scotland", "gb-sct"),
  flag("wls", "Wales", "gb-wls"),
  flag("nir", "Northern Ireland", "gb-nir"),
  flag("ie", "Ireland"),
  flag("fr", "France"),
  flag("de", "Germany"),
  flag("it", "Italy"),
  flag("es", "Spain"),
  flag("pt", "Portugal"),
  flag("nl", "Netherlands"),
  flag("be", "Belgium"),
  flag("lu", "Luxembourg"),
  flag("ch", "Switzerland"),
  flag("at", "Austria"),
  flag("dk", "Denmark"),
  flag("se", "Sweden"),
  flag("no", "Norway"),
  flag("fi", "Finland"),
  flag("pl", "Poland"),
  flag("cz", "Czechia"),
  flag("sk", "Slovakia"),
  flag("hu", "Hungary"),
  flag("ro", "Romania"),
  flag("bg", "Bulgaria"),
  flag("gr", "Greece"),
  flag("hr", "Croatia"),
  flag("si", "Slovenia"),
  flag("rs", "Serbia"),
  flag("ee", "Estonia"),
  flag("lv", "Latvia"),
  flag("lt", "Lithuania"),
  flag("ua", "Ukraine"),
  flag("tr", "Türkiye"),
  flag("us", "United States"),
  flag("ca", "Canada"),
  flag("mx", "Mexico"),
  flag("br", "Brazil"),
  flag("ar", "Argentina"),
  flag("cl", "Chile"),
  flag("co", "Colombia"),
  flag("au", "Australia"),
  flag("nz", "New Zealand"),
  flag("za", "South Africa"),
  flag("ae", "United Arab Emirates"),
  flag("sa", "Saudi Arabia"),
  flag("qa", "Qatar"),
  flag("in", "India"),
  flag("jp", "Japan"),
  flag("cn", "China"),
  flag("kr", "South Korea"),
  flag("th", "Thailand"),
  flag("my", "Malaysia"),
  flag("sg", "Singapore"),
  flag("ph", "Philippines"),
  flag("id", "Indonesia"),
]

/** Codes typed into the builder before it had a country picker. */
const olderCodes: Record<string, string> = {
  gbr: "gb", uk: "gb", irl: "ie", fra: "fr", deu: "de", ger: "de", ita: "it", esp: "es", prt: "pt", por: "pt",
  nld: "nl", ned: "nl", bel: "be", che: "ch", sui: "ch", aut: "at", dnk: "dk", den: "dk", swe: "se", nor: "no",
  fin: "fi", pol: "pl", usa: "us", can: "ca", bra: "br", aus: "au", nzl: "nz", jpn: "jp", zaf: "za", rsa: "za",
}

export function findFlag(value: string | undefined): HelmetFlag | undefined {
  const code = (value ?? "").trim().toLowerCase()
  return helmetFlags.find((item) => item.code === (olderCodes[code] ?? code))
}
