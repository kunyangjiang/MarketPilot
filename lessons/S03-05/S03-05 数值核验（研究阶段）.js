// S03-05 研究阶段数值核验（内部，不进入发布目录）2026-11-19。运行：node "S03-05 数值核验（研究阶段）.js"。M1–M11 对应研究简报第 8 节与核验表 N 编号。
const f=(x,d=4)=>Number(x).toFixed(d);
console.log("== M1 1900/1934 gold dollar");
const old=480/(25.8*0.9), nw=480/((15+5/21)*0.9);
console.log("old $/oz",f(old),"new $/oz",f(nw),"rise",f((nw/old-1)*100,2)+"%","weight ratio",f((15+5/21)/25.8*100,2)+"%","35/20.67-1",f((35/20.67-1)*100,2)+"%");
console.log("== M2 USGS MCS2026 prices");
const p={2021:1801,2022:1802,2023:1945,2024:2388,2025:3300};
console.log("2025/2024-1",f((p[2025]/p[2024]-1)*100,2)+"%","2024/2023-1",f((p[2024]/p[2023]-1)*100,2)+"%");
console.log("shares sum",40+24+21+7+7+1,"bars+coins",24+7);
console.log("== M3 SAFE implied valuation $/oz (亿美元*1e8 / 万盎司*1e4)");
const safe=[["2026.01",3695.82,7419],["2026.02",3875.88,7422],["2026.03",3427.63,7438],["2026.04",3441.72,7464],["2026.05",3407.52,7496],["2026.06",3037.24,7544],["2026.07",3063.54,7608],["2026.08",3500.80,7673],["2026.09",3235.17,7747],["2026.10",3064.11,7830]];
let prev=null;for(const [m,v,q] of safe){const px=v*1e8/(q*1e4);console.log(m,f(px,1),prev?f((px/prev-1)*100,2)+"%":"");prev=px;}
const p2=3875.88e8/7422e4,p10=3064.11e8/7830e4;console.log("Feb->Oct",f((p10/p2-1)*100,2)+"%");
console.log("Sep->Oct value change 亿美元",f(3064.11-3235.17,2),"qty +",7830-7747,"万盎司");
console.log("gold share of reserves Oct",f(3064.11/37775.61*100,2)+"%","Sep",f(3235.17/37894.25*100,2)+"%");
console.log("== M4 USGS DS140 $/t -> $/oz (t=32150.7 ozt)");
const ds={1933:847000,1934:1120000,1980:19700000,2001:8750000,2011:50600000,2012:53800000,2021:57900000,2022:57900000};
const real={1980:39000000,2001:8060000,2012:38200000,2022:32300000};
for(const y in ds)console.log(y,"nominal $/oz",f(ds[y]/32150.7,1));
for(const y in real)console.log(y,"real(1998$) $/oz",f(real[y]/32150.7,1));
console.log("real 1980->2001",f((real[2001]/real[1980]-1)*100,1)+"%","real 1980->2022",f((real[2022]/real[1980]-1)*100,1)+"%","nominal 1980->2001",f((ds[2001]/ds[1980]-1)*100,1)+"%");
console.log("== M5 thought experiment one year, $4,000 each");
const goldR=(4200-4000-0.004*4000)/4000; console.log("gold: cash 0, storage 16, price +200 => ",f(goldR*100,2)+"%");
const houseR=(160+(4080-4000))/4000; console.log("rental share: rent 160 + price 80 =>",f(houseR*100,2)+"%");
const goldFlat=(4000-4000-16)/4000; console.log("gold flat price =>",f(goldFlat*100,2)+"%");
console.log("== M6 roll intuition, spot fixed $60, 12 monthly rolls");
for(const fut of [60.30,59.70]){const per=60/fut-1;console.log("buy",fut,"per roll",f(per*100,4)+"%","12 rolls compounded",f((Math.pow(60/fut,12)-1)*100,2)+"%","per roll $/bbl",f(60-fut,2));}
console.log("== M7 gold carry: S=4000, r=4%/yr, 3 months, storage/lease ignored");
const F=4000*(1+0.04*0.25);console.log("F",f(F,2),"futures leg if spot flat",f(4000-F,2),"collateral interest",f(4000*0.04*0.25,2),"net",f(4000-F+4000*0.04*0.25,2));
console.log("== M8 GLD fee 0.40%/yr gold per share after n years");
for(const n of [1,10,20])console.log(n,f(Math.pow(1-0.004,n),4));
console.log("== M9 Erb-Harvey 2006 gold: spot -0.79 + roll -4.90 =",f(-0.79-4.90,2),"vs excess -5.68");
console.log("== M10 WGC FY2025 (research only) sector share of jewellery+tech+inv+CB");
const w={jew:1638.0,tech:322.8,inv:2175.3,cb:863.3};const s=Object.values(w).reduce((a,b)=>a+b);for(const k in w)console.log(k,f(w[k]/s*100,1)+"%");console.log("sum",f(s,1),"vs total incl OTC 5002.3");
console.log("== M11 S01-05 TIPS 2.86% opportunity cost on $4000 gold 1yr",f(4000*0.0286,2));
