import { NORTH_CODES, SOUTH_CODES, WEST_CODES, MRTS_CODES } from "./lines.ts";
import type { LineId, Station } from "../lib/transit/types.ts";

type Raw = Omit<Station, "sx" | "sy">;

const RAW: Raw[] = [
  // —— South (Beach → Chengalpattu) ——
  { code: "MSB", name: "Chennai Beach", nameTa: "சென்னை கடற்கரை", lat: 13.0698, lng: 80.285, lines: ["south", "west", "north", "mrts"], km: { south: 0, west: 0, north: 0, mrts: 0 }, interchange: true, terminal: true, cluster: "beach-central" },
  { code: "MSF", name: "Chennai Fort", nameTa: "சென்னை கோட்டை", lat: 13.0822, lng: 80.2706, lines: ["south", "mrts"], km: { south: 1.85, mrts: 1.7 }, interchange: true, terminal: false, cluster: "beach-central" },
  { code: "MPK", name: "Chennai Park", nameTa: "சென்னை பூங்கா", lat: 13.081, lng: 80.2754, lines: ["south"], km: { south: 3.07 }, interchange: true, terminal: false, cluster: "beach-central" },
  { code: "MS", name: "Chennai Egmore", nameTa: "சென்னை எழும்பூர்", lat: 13.078, lng: 80.261, lines: ["south"], km: { south: 4.32 }, interchange: true, terminal: false, metroInterchange: true, cluster: "beach-central" },
  { code: "MSC", name: "Chetpet", nameTa: "செட்பெட்", lat: 13.0715, lng: 80.2425, lines: ["south"], km: { south: 6.56 }, interchange: false, terminal: false, metroInterchange: true },
  { code: "NBK", name: "Nungambakkam", nameTa: "நுங்கம்பாக்கம்", lat: 13.064, lng: 80.233, lines: ["south"], km: { south: 8.15 }, interchange: false, terminal: false },
  { code: "MKK", name: "Kodambakkam", nameTa: "கோடம்பாக்கம்", lat: 13.052, lng: 80.221, lines: ["south"], km: { south: 9.68 }, interchange: false, terminal: false, metroInterchange: true },
  { code: "MBM", name: "Mambalam", nameTa: "மாம்பலம்", lat: 13.0385, lng: 80.2215, lines: ["south"], km: { south: 11.29 }, interchange: false, terminal: false },
  { code: "SP", name: "Saidapet", nameTa: "சைதாப்பேட்டை", lat: 13.021, lng: 80.2205, lines: ["south"], km: { south: 12.9 }, interchange: false, terminal: false },
  { code: "GDY", name: "Guindy", nameTa: "கிண்டி", lat: 13.008, lng: 80.213, lines: ["south"], km: { south: 15.01 }, interchange: true, terminal: false, metroInterchange: true },
  { code: "STM", name: "St. Thomas Mount", nameTa: "பரங்கிமலை", lat: 13.005, lng: 80.1965, lines: ["south", "mrts"], km: { south: 17.12, mrts: 23.2 }, interchange: true, terminal: false, metroInterchange: true },
  { code: "PZA", name: "Pazhavanthangal", nameTa: "பழவந்தாங்கல்", lat: 12.989, lng: 80.188, lines: ["south"], km: { south: 18.75 }, interchange: false, terminal: false },
  { code: "MN", name: "Meenambakkam", nameTa: "மீனம்பாக்கம்", lat: 12.9875, lng: 80.1755, lines: ["south"], km: { south: 20.04 }, interchange: false, terminal: false },
  { code: "TLM", name: "Tirusulam", nameTa: "திருசூலம்", lat: 12.973, lng: 80.164, lines: ["south"], km: { south: 21.22 }, interchange: false, terminal: false, metroInterchange: true },
  { code: "PV", name: "Pallavaram", nameTa: "பல்லாவரம்", lat: 12.9675, lng: 80.149, lines: ["south"], km: { south: 23.15 }, interchange: false, terminal: false },
  { code: "CMP", name: "Chromepet", nameTa: "குரோம்பேட்டை", lat: 12.9518, lng: 80.141, lines: ["south"], km: { south: 25.35 }, interchange: false, terminal: false, metroInterchange: true },
  { code: "TBMS", name: "Tambaram Sanatorium", nameTa: "தாம்பரம் சானடோரியம்", lat: 12.936, lng: 80.128, lines: ["south"], km: { south: 27.36 }, interchange: false, terminal: false },
  { code: "TBM", name: "Tambaram", nameTa: "தாம்பரம்", lat: 12.9249, lng: 80.1176, lines: ["south"], km: { south: 29.14 }, interchange: true, terminal: true, metroInterchange: true },
  { code: "PRGL", name: "Perungalathur", nameTa: "பெருங்களத்தூர்", lat: 12.9045, lng: 80.096, lines: ["south"], km: { south: 32.64 }, interchange: false, terminal: false },
  { code: "VDR", name: "Vandalur", nameTa: "வண்டலூர்", lat: 12.892, lng: 80.081, lines: ["south"], km: { south: 34.44 }, interchange: false, terminal: false },
  { code: "KLBA", name: "Kilambakkam", nameTa: "கிளாம்பாக்கம்", lat: 12.8745, lng: 80.0766, lines: ["south"], km: { south: 36.65 }, interchange: true, terminal: false, aliases: ["KBTM"] },
  { code: "UPM", name: "Urapakkam", nameTa: "உரப்பாக்கம்", lat: 12.867, lng: 80.068, lines: ["south"], km: { south: 37.5 }, interchange: false, terminal: false },
  { code: "GI", name: "Guduvancheri", nameTa: "குடுவஞ்சேரி", lat: 12.845, lng: 80.057, lines: ["south"], km: { south: 40.41 }, interchange: false, terminal: false },
  { code: "POTI", name: "Potheri", nameTa: "போத்தேரி", lat: 12.825, lng: 80.045, lines: ["south"], km: { south: 43.94 }, interchange: false, terminal: false },
  { code: "CTM", name: "Kattankulathur", nameTa: "காட்டாங்குளத்தூர்", lat: 12.811, lng: 80.027, lines: ["south"], km: { south: 45.85 }, interchange: false, terminal: false },
  { code: "MMNK", name: "Maraimalai Nagar", nameTa: "மரைமலை நகர்", lat: 12.801, lng: 80.022, lines: ["south"], km: { south: 46.96 }, interchange: false, terminal: false },
  { code: "SKL", name: "Singaperumal Koil", nameTa: "சிங்கபெருமாள் கோயில்", lat: 12.761, lng: 80.004, lines: ["south"], km: { south: 51.48 }, interchange: false, terminal: false },
  { code: "PWU", name: "Paranur", nameTa: "பரனூர்", lat: 12.722, lng: 79.992, lines: ["south"], km: { south: 55.59 }, interchange: false, terminal: false },
  { code: "CGL", name: "Chengalpattu", nameTa: "செங்கல்பட்டு", lat: 12.6819, lng: 79.9836, lines: ["south"], km: { south: 59.84 }, interchange: true, terminal: true },

  // —— West / North shared city approach ——
  { code: "RPM", name: "Royapuram", nameTa: "ராயபுரம்", lat: 13.104, lng: 80.2935, lines: ["west", "north"], km: { west: 4.3, north: 4.3 }, interchange: false, terminal: false, cluster: "beach-central" },
  { code: "WST", name: "Washermanpet", nameTa: "வண்ணாரப்பேட்டை", lat: 13.1088, lng: 80.2805, lines: ["west", "north"], km: { west: 6.0, north: 6.0 }, interchange: false, terminal: false, metroInterchange: true, cluster: "beach-central" },
  { code: "MASS", name: "Chennai Central Suburban", nameTa: "சென்னை சென்ட்ரல் புறநகர்", lat: 13.0827, lng: 80.2747, lines: ["west", "north"], km: { west: 7.1, north: 7.1 }, interchange: true, terminal: true, metroInterchange: true, cluster: "beach-central", aliases: ["MMCC"] },
  { code: "BBQ", name: "Basin Bridge", nameTa: "பேசின் பாலம்", lat: 13.0985, lng: 80.271, lines: ["west", "north"], km: { west: 8.8, north: 8.8 }, interchange: true, terminal: false, cluster: "beach-central" },

  // —— West (Central → Tiruttani) ——
  { code: "VJM", name: "Vyasarpadi Jeeva", nameTa: "வியாசர்பாடி ஜீவா", lat: 13.116, lng: 80.257, lines: ["west"], km: { west: 10.2 }, interchange: false, terminal: false },
  { code: "PER", name: "Perambur", nameTa: "பெரம்பூர்", lat: 13.1075, lng: 80.2445, lines: ["west"], km: { west: 11.4 }, interchange: false, terminal: false },
  { code: "PCW", name: "Perambur Carriage Works", nameTa: "பெரம்பூர் கேரேஜ் வொர்க்ஸ்", lat: 13.107, lng: 80.236, lines: ["west"], km: { west: 12.4 }, interchange: false, terminal: false },
  { code: "PEW", name: "Perambur Loco Works", nameTa: "பெரம்பூர் லோகோ வொர்க்ஸ்", lat: 13.108, lng: 80.227, lines: ["west"], km: { west: 13.3 }, interchange: false, terminal: false },
  { code: "VLK", name: "Villivakkam", nameTa: "வில்லிவாக்கம்", lat: 13.112, lng: 80.207, lines: ["west"], km: { west: 15.0 }, interchange: false, terminal: false },
  { code: "KOTR", name: "Korattur", nameTa: "கோரட்டூர்", lat: 13.1125, lng: 80.184, lines: ["west"], km: { west: 16.9 }, interchange: false, terminal: false },
  { code: "PVM", name: "Pattaravakkam", nameTa: "பட்டரவாக்கம்", lat: 13.114, lng: 80.169, lines: ["west"], km: { west: 18.2 }, interchange: false, terminal: false },
  { code: "ABU", name: "Ambattur", nameTa: "அம்பத்தூர்", lat: 13.1148, lng: 80.148, lines: ["west"], km: { west: 19.4 }, interchange: false, terminal: false },
  { code: "TMVL", name: "Thirumullaivoyal", nameTa: "திருமுல்லைவாயில்", lat: 13.126, lng: 80.131, lines: ["west"], km: { west: 21.0 }, interchange: false, terminal: false },
  { code: "ANNR", name: "Annanur", nameTa: "அண்ணனூர்", lat: 13.118, lng: 80.12, lines: ["west"], km: { west: 22.1 }, interchange: false, terminal: false },
  { code: "AVD", name: "Avadi", nameTa: "ஆவடி", lat: 13.1143, lng: 80.1018, lines: ["west"], km: { west: 23.4 }, interchange: true, terminal: true },
  { code: "HC", name: "Hindu College", nameTa: "இந்து கல்லூரி", lat: 13.112, lng: 80.085, lines: ["west"], km: { west: 25.3 }, interchange: false, terminal: false },
  { code: "PAB", name: "Pattabiram", nameTa: "பட்டாபிரம்", lat: 13.118, lng: 80.06, lines: ["west"], km: { west: 26.8 }, interchange: false, terminal: false },
  { code: "PTMS", name: "Pattabiram Military Siding", nameTa: "பட்டாபிரம் மிலிட்டரி", lat: 13.122, lng: 80.05, lines: ["west"], km: { west: 28.1 }, interchange: false, terminal: false },
  { code: "PRES", name: "Pattabiram East Depot", nameTa: "பட்டாபிரம் கிழக்கு டெப்போ", lat: 13.124, lng: 80.042, lines: ["west"], km: { west: 29.0 }, interchange: false, terminal: false },
  { code: "NEC", name: "Nemilichery", nameTa: "நெமிலிச்சேரி", lat: 13.126, lng: 80.028, lines: ["west"], km: { west: 30.2 }, interchange: false, terminal: false },
  { code: "TI", name: "Thiruninravur", nameTa: "திருநின்றவூர்", lat: 13.131, lng: 80.01, lines: ["west"], km: { west: 32.0 }, interchange: false, terminal: false },
  { code: "VEU", name: "Veppampattu", nameTa: "வேப்பம்பட்டு", lat: 13.133, lng: 79.988, lines: ["west"], km: { west: 34.1 }, interchange: false, terminal: false },
  { code: "SVR", name: "Sevvapet Road", nameTa: "செவ்வாப்பேட்டை ரோடு", lat: 13.135, lng: 79.965, lines: ["west"], km: { west: 36.2 }, interchange: false, terminal: false },
  { code: "PTLR", name: "Putlur", nameTa: "புதலூர்", lat: 13.137, lng: 79.942, lines: ["west"], km: { west: 38.4 }, interchange: false, terminal: false },
  { code: "TRL", name: "Tiruvallur", nameTa: "திருவள்ளூர்", lat: 13.143, lng: 79.909, lines: ["west"], km: { west: 42.0 }, interchange: true, terminal: true },
  { code: "EGT", name: "Egattur", nameTa: "ஏகாட்டூர்", lat: 13.14, lng: 79.875, lines: ["west"], km: { west: 44.6 }, interchange: false, terminal: false },
  { code: "KBT", name: "Kadambattur", nameTa: "கடம்பத்தூர்", lat: 13.138, lng: 79.848, lines: ["west"], km: { west: 47.0 }, interchange: false, terminal: false },
  { code: "SPAM", name: "Senjipanambakkam", nameTa: "செஞ்சியபனம்பாக்கம்", lat: 13.13, lng: 79.81, lines: ["west"], km: { west: 50.2 }, interchange: false, terminal: false },
  { code: "MAF", name: "Manavur", nameTa: "மானவூர்", lat: 13.12, lng: 79.775, lines: ["west"], km: { west: 53.1 }, interchange: false, terminal: false },
  { code: "TO", name: "Thiruvalangadu", nameTa: "திருவாலங்காடு", lat: 13.13, lng: 79.725, lines: ["west"], km: { west: 56.8 }, interchange: false, terminal: false },
  { code: "MOS", name: "Mosur", nameTa: "மோசூர்", lat: 13.11, lng: 79.7, lines: ["west"], km: { west: 60.4 }, interchange: false, terminal: false },
  { code: "PLMG", name: "Puliyamangalam", nameTa: "புளியமங்கலம்", lat: 13.095, lng: 79.685, lines: ["west"], km: { west: 62.5 }, interchange: false, terminal: false },
  { code: "AJJ", name: "Arakkonam", nameTa: "அரக்கோணம்", lat: 13.084, lng: 79.67, lines: ["west"], km: { west: 68.5 }, interchange: true, terminal: true },
  { code: "TRT", name: "Tiruttani", nameTa: "திருத்தணி", lat: 13.175, lng: 79.611, lines: ["west"], km: { west: 82.9 }, interchange: false, terminal: true },

  // —— North (Central → Sullurupeta) ——
  { code: "KOK", name: "Korukkupet", nameTa: "கொருக்குப்பேட்டை", lat: 13.118, lng: 80.278, lines: ["north"], km: { north: 10.0 }, interchange: false, terminal: false },
  { code: "TNP", name: "Tondiarpet", nameTa: "தண்டையார்பேட்டை", lat: 13.126, lng: 80.289, lines: ["north"], km: { north: 11.5 }, interchange: false, terminal: false },
  { code: "VOC", name: "V.O.C. Nagar", nameTa: "வி.ஓ.சி. நகர்", lat: 13.14, lng: 80.296, lines: ["north"], km: { north: 12.8 }, interchange: false, terminal: false },
  { code: "TVT", name: "Tiruvottiyur", nameTa: "திருவொற்றியூர்", lat: 13.16, lng: 80.307, lines: ["north"], km: { north: 14.5 }, interchange: false, terminal: false },
  { code: "WCN", name: "Wimco Nagar", nameTa: "விம்கோ நகர்", lat: 13.179, lng: 80.309, lines: ["north"], km: { north: 16.2 }, interchange: false, terminal: false, metroInterchange: true },
  { code: "KAVM", name: "Kathivakkam", nameTa: "காத்திவாக்கம்", lat: 13.192, lng: 80.318, lines: ["north"], km: { north: 18.0 }, interchange: false, terminal: false },
  { code: "ENR", name: "Ennore", nameTa: "எண்ணூர்", lat: 13.214, lng: 80.32, lines: ["north"], km: { north: 19.8 }, interchange: false, terminal: false },
  { code: "AIPP", name: "Athipattu Pudunagar", nameTa: "அத்திப்பட்டு புதுநகர்", lat: 13.258, lng: 80.318, lines: ["north"], km: { north: 22.4 }, interchange: false, terminal: false },
  { code: "AIP", name: "Athipattu", nameTa: "அத்திப்பட்டு", lat: 13.274, lng: 80.321, lines: ["north"], km: { north: 24.1 }, interchange: false, terminal: false },
  { code: "NPKM", name: "Nandiambakkam", nameTa: "நந்தியம்பாக்கம்", lat: 13.292, lng: 80.327, lines: ["north"], km: { north: 25.6 }, interchange: false, terminal: false },
  { code: "MJR", name: "Minjur", nameTa: "மிஞ்சூர்", lat: 13.279, lng: 80.258, lines: ["north"], km: { north: 27.4 }, interchange: false, terminal: false },
  { code: "APB", name: "Anuppambattu", nameTa: "அனுப்பம்பட்டு", lat: 13.31, lng: 80.29, lines: ["north"], km: { north: 30.1 }, interchange: false, terminal: false },
  { code: "PON", name: "Ponneri", nameTa: "பொன்னேரி", lat: 13.338, lng: 80.195, lines: ["north"], km: { north: 33.6 }, interchange: false, terminal: false },
  { code: "KVP", name: "Kavaraipettai", nameTa: "கவரைப்பேட்டை", lat: 13.37, lng: 80.21, lines: ["north"], km: { north: 37.2 }, interchange: false, terminal: false },
  { code: "GPD", name: "Gummidipoondi", nameTa: "கும்மிடிப்பூண்டி", lat: 13.407, lng: 80.342, lines: ["north"], km: { north: 47.2 }, interchange: true, terminal: true },
  { code: "ELR", name: "Elavur", nameTa: "இலவூர்", lat: 13.48, lng: 80.28, lines: ["north"], km: { north: 54.0 }, interchange: false, terminal: false },
  { code: "AKM", name: "Arambakkam", nameTa: "அரம்பாக்கம்", lat: 13.542, lng: 80.2, lines: ["north"], km: { north: 62.0 }, interchange: false, terminal: false },
  { code: "TADA", name: "Tada", nameTa: "தடா", lat: 13.587, lng: 80.037, lines: ["north"], km: { north: 70.5 }, interchange: false, terminal: false },
  { code: "SPE", name: "Sullurupeta", nameTa: "சுள்ளூருப்பேட்டை", lat: 13.759, lng: 80.016, lines: ["north"], km: { north: 82.7 }, interchange: false, terminal: true },

  // —— MRTS (Beach → Velachery → St. Thomas Mount) ——
  { code: "MPKT", name: "Chennai Park Town", nameTa: "சென்னை பூங்கா நகர்", lat: 13.0795, lng: 80.2768, lines: ["mrts"], km: { mrts: 2.6 }, interchange: true, terminal: false, cluster: "beach-central" },
  { code: "MCPT", name: "Chintadripet", nameTa: "சிந்தாதிரிப்பேட்டை", lat: 13.072, lng: 80.275, lines: ["mrts"], km: { mrts: 3.5 }, interchange: false, terminal: false },
  { code: "MCPK", name: "Chepauk", nameTa: "சேப்பாக்கம்", lat: 13.0625, lng: 80.281, lines: ["mrts"], km: { mrts: 4.6 }, interchange: false, terminal: false },
  { code: "MTCN", name: "Thiruvallikeni", nameTa: "திருவல்லிக்கேணி", lat: 13.058, lng: 80.2755, lines: ["mrts"], km: { mrts: 5.7 }, interchange: false, terminal: false, aliases: ["Triplicane"] },
  { code: "MLHS", name: "Light House", nameTa: "லைட் ஹவுஸ்", lat: 13.0398, lng: 80.279, lines: ["mrts"], km: { mrts: 6.8 }, interchange: false, terminal: false },
  { code: "MKAK", name: "Mundakanniamman Koil", nameTa: "முண்டகண்ணியம்மன் கோயில்", lat: 13.03, lng: 80.273, lines: ["mrts"], km: { mrts: 8.0 }, interchange: false, terminal: false },
  { code: "MTMY", name: "Thirumayilai", nameTa: "திருமயிலை", lat: 13.027, lng: 80.267, lines: ["mrts"], km: { mrts: 8.9 }, interchange: false, terminal: false, aliases: ["Mylapore"] },
  { code: "MNDY", name: "Mandaveli", nameTa: "மண்டவெளி", lat: 13.022, lng: 80.261, lines: ["mrts"], km: { mrts: 10.0 }, interchange: false, terminal: false },
  { code: "GWYR", name: "Greenways Road", nameTa: "கிரீன்வேஸ் ரோடு", lat: 13.015, lng: 80.251, lines: ["mrts"], km: { mrts: 11.2 }, interchange: false, terminal: false },
  { code: "KTPM", name: "Kotturpuram", nameTa: "கோட்டூர்புரம்", lat: 13.013, lng: 80.242, lines: ["mrts"], km: { mrts: 12.4 }, interchange: false, terminal: false },
  { code: "KTBR", name: "Kasturba Nagar", nameTa: "கஸ்தூர்பா நகர்", lat: 13.005, lng: 80.247, lines: ["mrts"], km: { mrts: 13.4 }, interchange: false, terminal: false },
  { code: "INDR", name: "Indira Nagar", nameTa: "இந்திரா நகர்", lat: 12.996, lng: 80.251, lines: ["mrts"], km: { mrts: 14.2 }, interchange: false, terminal: false },
  { code: "TYMR", name: "Tiruvanmiyur", nameTa: "திருவான்மியூர்", lat: 12.983, lng: 80.259, lines: ["mrts"], km: { mrts: 15.1 }, interchange: false, terminal: false },
  { code: "TRMN", name: "Taramani", nameTa: "தரமணி", lat: 12.978, lng: 80.24, lines: ["mrts"], km: { mrts: 16.6 }, interchange: false, terminal: false },
  { code: "PRGD", name: "Perungudi", nameTa: "பெருங்குடி", lat: 12.971, lng: 80.226, lines: ["mrts"], km: { mrts: 17.8 }, interchange: false, terminal: false },
  { code: "VLCY", name: "Velachery", nameTa: "வேளச்சேரி", lat: 12.975, lng: 80.221, lines: ["mrts"], km: { mrts: 19.3 }, interchange: true, terminal: true },
  { code: "PZV", name: "Puzhuthivakkam", nameTa: "புழுதிவாக்கம்", lat: 12.984, lng: 80.206, lines: ["mrts"], km: { mrts: 20.6 }, interchange: false, terminal: false },
  { code: "ADBK", name: "Adambakkam", nameTa: "ஆதம்பாக்கம்", lat: 12.991, lng: 80.201, lines: ["mrts"], km: { mrts: 21.8 }, interchange: false, terminal: false },
];

type Wp = { km: number; x: number; y: number };

const LAYOUT: Record<LineId, Wp[]> = {
  south: [
    { km: 0, x: 1110, y: 432 },
    { km: 4.32, x: 1012, y: 498 },
    { km: 17.12, x: 868, y: 575 },
    { km: 29.14, x: 742, y: 655 },
    { km: 59.84, x: 488, y: 838 },
  ],
  west: [
    { km: 0, x: 1110, y: 432 },
    { km: 7.1, x: 1006, y: 392 },
    { km: 8.8, x: 980, y: 348 },
    { km: 11.4, x: 900, y: 358 },
    { km: 23.4, x: 690, y: 352 },
    { km: 42.0, x: 400, y: 348 },
    { km: 68.5, x: 168, y: 338 },
    { km: 82.9, x: 42, y: 292 },
  ],
  north: [
    { km: 0, x: 1110, y: 432 },
    { km: 7.1, x: 1006, y: 392 },
    { km: 8.8, x: 980, y: 348 },
    { km: 14.5, x: 958, y: 248 },
    { km: 19.8, x: 948, y: 182 },
    { km: 47.2, x: 930, y: 78 },
    { km: 82.7, x: 918, y: 22 },
  ],
  mrts: [
    { km: 0, x: 1110, y: 432 },
    { km: 1.7, x: 1074, y: 456 },
    { km: 2.6, x: 1048, y: 478 },
    { km: 6.8, x: 1218, y: 548 },
    { km: 8.9, x: 1184, y: 598 },
    { km: 15.1, x: 1088, y: 698 },
    { km: 19.3, x: 980, y: 758 },
    { km: 23.2, x: 868, y: 575 },
  ],
};

/** Hand-placed Beach / Central cluster so four lines don't collapse into one blob. */
const CLUSTER: Record<string, { x: number; y: number }> = {
  MSB: { x: 1110, y: 432 },
  MSF: { x: 1074, y: 456 },
  MPK: { x: 1034, y: 478 },
  MPKT: { x: 1052, y: 492 },
  MS: { x: 1008, y: 508 },
  MSC: { x: 972, y: 528 },
  RPM: { x: 1084, y: 400 },
  WST: { x: 1048, y: 388 },
  MASS: { x: 1006, y: 392 },
  BBQ: { x: 980, y: 348 },
  STM: { x: 868, y: 575 },
};

function along(wps: Wp[], km: number): { x: number; y: number } {
  if (km <= wps[0].km) return { x: wps[0].x, y: wps[0].y };
  const last = wps[wps.length - 1];
  if (km >= last.km) return { x: last.x, y: last.y };
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
    if (km >= a.km && km <= b.km) {
      const t = (km - a.km) / (b.km - a.km || 1);
      return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    }
  }
  return { x: last.x, y: last.y };
}

function withXY(s: Raw): Station {
  if (CLUSTER[s.code]) {
    const c = CLUSTER[s.code];
    return { ...s, sx: c.x, sy: c.y };
  }
  const order: LineId[] = ["south", "west", "north", "mrts"];
  for (const id of order) {
    const km = s.km[id];
    if (km != null) {
      const p = along(LAYOUT[id], km);
      return { ...s, sx: Math.round(p.x * 10) / 10, sy: Math.round(p.y * 10) / 10 };
    }
  }
  return { ...s, sx: 700, sy: 400 };
}

export const STATIONS: Station[] = RAW.map(withXY);

export const STATION_BY_CODE: Record<string, Station> = Object.fromEntries(
  STATIONS.flatMap((s) => {
    const entries: [string, Station][] = [[s.code, s]];
    for (const a of s.aliases ?? []) entries.push([a, s]);
    return entries;
  }),
);

export function stationOf(code: string): Station | undefined {
  return STATION_BY_CODE[code.toUpperCase()] ?? STATION_BY_CODE[code];
}

export function stationsOn(line: LineId): Station[] {
  const codes =
    line === "south"
      ? SOUTH_CODES
      : line === "west"
        ? WEST_CODES
        : line === "north"
          ? NORTH_CODES
          : MRTS_CODES;
  return codes.map((c) => STATION_BY_CODE[c]).filter(Boolean);
}

export const LINE_OFFSET: Record<LineId, number> = {
  south: 0,
  west: -7,
  north: 7,
  mrts: 11,
};

export function offsetPoint(s: Station, line: LineId): { x: number; y: number } {
  const o = LINE_OFFSET[line] ?? 0;
  return { x: s.sx, y: s.sy + o };
}
