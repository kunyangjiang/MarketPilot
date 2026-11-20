const r=0.04, LGD=0.6;
function co(name,PD,obs){
  const EL=PD*LGD;
  const price=100*(1-EL)/(1+r);
  const y=100/price-1;
  const exact=y-r;
  const implPD_approx=obs/LGD;
  // exact implied PD: price_obs=100/(1+r+obs); 100*(1-q*LGD)/(1+r)=price_obs
  const q=(1-(1+r)/(1+r+obs))/LGD;
  console.log(name,{EL_pct:(EL*100).toFixed(4),price:price.toFixed(4),yield_pct:(y*100).toFixed(4),spreadEL_exact_pct:(exact*100).toFixed(4),
    EL_share_of_obs_pct:(EL/obs*100).toFixed(2),resid_pct:((obs-EL)*100).toFixed(2),impliedPD_approx_pct:(implPD_approx*100).toFixed(3),
    impliedPD_exact_pct:(q*100).toFixed(3),ratio_exact:(q/PD).toFixed(2),ratio_approx:(implPD_approx/PD).toFixed(2), total_yield_pct:((r+obs)*100).toFixed(2)});
}
co('甲',0.001,0.009); co('乙',0.04,0.04);
console.log('spread ratio 乙/甲', (0.04/0.009).toFixed(3), 'yield ratio',(0.08/0.049).toFixed(3));
// two-state clustering
console.log('avg PD', (0.9*0.0005+0.1*0.0055)*100);
// EGAM WP 1999, 10y industrial
for (const [g,tot,el,eltax] of [['AA',0.603,0.048,0.335],['A',0.785,0.140,0.423],['BBB',1.180,0.409,0.683]]){
  const tax=eltax-el, res=tot-eltax;
  console.log('EGAM',g,{EL:(el/tot*100).toFixed(1),tax:+tax.toFixed(3),taxsh:(tax/tot*100).toFixed(1),res:+res.toFixed(3),ressh:(res/tot*100).toFixed(1)});
}
// FRBSF: 4-yr cum PD 1.55%, recovery 45%
const cum=0.0155, L2=0.55, loss=cum*L2;
console.log('FRBSF 4y loss',(loss*100).toFixed(4),'simple/4',(loss/4*100).toFixed(4),'cont',(-Math.log(1-loss)/4*100).toFixed(4),'share of 160bp',(22/160*100).toFixed(1));
console.log('HH slides Baa 32/158',(32/158*100).toFixed(1),'Aaa 1/55',(1/55*100).toFixed(1));
console.log('CCG 57/? FRBSF 0.22+0.35=',0.22+0.35);
console.log('F&S 0.95^3',Math.pow(0.95,3));
// EBP csv recompute
// 联储 EBP 序列为研究下载，不随仓库保存（底层含授权数据）；文件不在时跳过这一段
const fs=require('fs');const EBP=require('path').join(__dirname,'s0303dl','ebp.csv');if(fs.existsSync(EBP)){const L=fs.readFileSync(EBP,'utf8').trim().split('\n').slice(1).map(l=>l.split(','));
const g=d=>L.find(a=>a[0]==d);for(const d of ['2008-10-01','2020-03-01','2026-10-01']){const a=g(d);console.log(d,(+a[1]).toFixed(2),(+a[2]).toFixed(2),(a[1]-a[2]).toFixed(2))}
console.log('n',L.length,'first',L[0][0],'last',L[L.length-1][0]);}else console.log('EBP csv 不在本地，跳过');
// state tax example from EGAM: 10% coupon x 5% = 0.5%
console.log('tax ex',0.10*0.05);
