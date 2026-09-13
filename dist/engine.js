export const SITES=['Duliajan','Moran','Naharkatiya','Digboi'];
export const DEMO_REPORT='Hydrocarbon leak noticed at flange beside active hot-work area. Positive isolation was not confirmed. Two workers were inside the line-of-fire zone.';
export const RULES=[
 {name:'Hot Work',icon:'flame',terms:/hot[- ]work|weld(?:ing)?|grind(?:ing)?|cutting torch/ig,hazard:/leak|hydrocarbon|flammable|gas|vapou?r/ig,barrier:'Ignition control and positive isolation',worst:'A release could ignite and expose nearby personnel to a flash fire.',actions:['Suspend hot work pending competent HSE review.','Verify isolation and gas testing against the approved permit.','Inspect nearby work fronts for the same exposure.']},
 {name:'Energy Isolation',icon:'bolt',terms:/isolat\w*|lockout|tagout|loto|electri\w*|energi[sz]\w*/ig,hazard:/live|pressure|hydrocarbon|electri\w*|energi[sz]\w*/ig,barrier:'Verified energy isolation',worst:'Uncontrolled energy release could cause serious or fatal injury.',actions:['Pause the affected work and involve the authorized supervisor.','Verify all energy sources are isolated under the approved procedure.']},
 {name:'Working at Height',icon:'height',terms:/height|scaffold|harness|roof|ladder|platform|fall arrest/ig,hazard:/height|\d+\s*met(?:er|re)s?|roof|scaffold/ig,barrier:'Fall protection and safe access',worst:'A fall from an elevated position could cause serious or fatal injury.',actions:['Restrict access to the affected elevated work area.','Have a competent person verify fall protection and the work platform.']},
 {name:'Confined Space',icon:'box',terms:/confined|tank entry|vessel entry|entered (?:the )?tank|oxygen|gas test/ig,hazard:/tank|vessel|confined|oxygen|gas/ig,barrier:'Entry authorization and atmosphere testing',worst:'An unsafe atmosphere could incapacitate a person inside the space.',actions:['Pause entry and refer the conditions to the permit issuer.','Verify atmospheric testing, isolation, and rescue readiness.']},
 {name:'Safe Mechanical Lifting',icon:'anchor',terms:/crane|lift(?:ing)?|suspended load|sling|rigg\w*/ig,hazard:/load|crane|sling/ig,barrier:'Lifting exclusion zone and equipment integrity',worst:'A dropped or swinging load could cause a fatal struck-by injury.',actions:['Secure the lifting area and prevent access below the load.','Request a competent review of the lift plan and equipment.']},
 {name:'Line of Fire',icon:'target',terms:/line[- ]of[- ]fire|suspended load|beneath|pinch point|moving equipment|reversing/ig,hazard:/load|moving|pressure|hydrocarbon|vehicle|workers?/ig,barrier:'Personnel separation from hazardous energy',worst:'Personnel in the path of released energy could suffer a fatal injury.',actions:['Move personnel away from the identified exposure path.','Verify barriers and exclusion zones with the site supervisor.']},
 {name:'Driving',icon:'truck',terms:/driv\w*|vehicle|truck|seatbelt|reversing|speeding/ig,hazard:/truck|vehicle|speeding|reversing/ig,barrier:'Vehicle and pedestrian separation',worst:'A vehicle collision could seriously injure an occupant or pedestrian.',actions:['Pause the affected vehicle movement for supervisor review.','Verify pedestrian separation and driving controls.']}
];
const failure=/\b(?:not (?:positively )?(?:confirmed|isolated|tested|attached|secured|verified|available|connected|locked out|wearing)|without|missing|failed|bypassed|unsecured|unguarded|damaged|no (?:gas test|harness|isolation|barrier|barricade|permit|spotter|fall protection|attendant)|unprotected|disconnected|not worn|tearing)\b/i;
const uncertain=/\b(?:unclear|unknown|possibly|may have|not sure|unconfirmed|not confirmed|not recorded|not documented)\b/i;
const exposure=/\b(?:workers?|personnel|operator|technician|contractor|person|entered|entry|beneath|pedestrian)\b/i;
const adverse=/\b(?:leak(?:ing|ed)?|release|fell|falling|smoke|spark\w*|struck|contact|speeding|live cable|open edge|pressurized|sprayed|alarm sounded|tearing)\b/i;
const controlled=/\b(?:verified|confirmed|secured|barricaded|tested|isolated|attached|no leak|no exposure|no personnel|no workers|work stopped|work suspended)\b/i;
export function analyze(narrative,history=[],site='Duliajan',reportedAt=new Date().toISOString()){
 const text=narrative.trim();
 const sentences=text.match(/[^.!?;]+[.!?;]?/g)?.flatMap(s=>s.split(/\b(?:but|however|although)\b/i))||[text];
 const active=sentences.filter(s=>!/^\s*(?:training|example|drill|hypothetical)/i.test(s));
 const rules=RULES.filter(r=>{r.terms.lastIndex=0;return r.terms.test(active.join(' '))});
 const adverseContext=active.join(' ');if(/pressurized|sprayed|release zone|stood under|underneath/i.test(adverseContext)&&!rules.some(r=>r.name==='Line of Fire'))rules.push(RULES.find(r=>r.name==='Line of Fire'));
 const evidence=[];const barriers=[];let hasFailure=false,hasUncertainty=false,hasExposure=false,hasAdverse=false,hasControl=false;
 for(const raw of active){const s=raw.trim();const f=failure.test(s),u=uncertain.test(s);const unsafeAdverse=adverse.test(s)&&!(/\bno (?:hydrocarbon )?leak|no (?:gas )?release|no exposed|no live cable/i.test(s));
   if(f||u||unsafeAdverse)evidence.push(s);hasFailure ||=f;hasUncertainty ||=u;hasAdverse ||=unsafeAdverse;
   hasExposure ||=(exposure.test(s)||/\bfitter|spotter|driver\b/i.test(s))&&!(/\bno (?:workers?|personnel|exposure|entry)|nobody|workers remained behind intact guardrails|all workers (?:were )?outside|entry (?:was )?(?:prohibited|prevented)|work (?:was )?(?:stopped|suspended)/i.test(s));hasControl ||=(controlled.test(s)||/intact guardrails|tethered/i.test(s))&&!f&&!u;
   if(f){const relevant=rules.filter(r=>{r.terms.lastIndex=0;return r.terms.test(s)});for(const r of relevant.length?relevant:rules.slice(0,1))if(!barriers.some(b=>b.name===r.barrier))barriers.push({name:r.barrier,evidence:s,status:u?'Unverified':'Potential failure'});}
 }
 const related=history.filter(r=>rules.some(x=>r.rules?.includes(x.name)));
 const cluster=rules.find(r=>['Hot Work','Working at Height','Confined Space','Safe Mechanical Lifting','Driving'].includes(r.name))?.name||rules[0]?.name||'Uncategorized';
 const end=new Date(reportedAt).getTime(),start=end-14*86400000;
 const recurrence=new Set(history.filter(r=>r.cluster===cluster&&r.score>=50&&new Date(r.date).getTime()>=start&&new Date(r.date).getTime()<=end).map(r=>r.id)).size;
 const noKnownHazard=rules.length===0;const terse=text.split(/\s+/).length<12;
 const uncertainCase=hasUncertainty||terse||noKnownHazard;
 const controlOnly=hasControl&&!hasFailure&&!hasAdverse;
 const fatal=noKnownHazard?20:controlOnly?18:hasFailure&&(hasAdverse||hasExposure)?98:hasFailure?85:hasAdverse?78:40;
 const barrier=hasFailure?95:hasUncertainty?70:controlOnly?10:35;
 const exposed=hasExposure?(hasFailure?95:65):controlOnly?10:30;
 const recurring=Math.min(100,recurrence*15);const uncertainty=uncertainCase?85:hasFailure?45:20;
 const components=[{name:'Fatal potential',weight:35,value:fatal},{name:'Barrier failure',weight:25,value:barrier},{name:'Exposure',weight:15,value:exposed},{name:'Recurrence',weight:15,value:recurring},{name:'Uncertainty',weight:10,value:uncertainty}];
 const score=Math.min(99,Math.round(components.reduce((a,c)=>a+c.value*c.weight/100,0)));
 const level=score>=85?'Critical':score>=70?'High':score>=45?'Moderate':'Low';
 const review=uncertainCase||score>=70;
 const status=score>=85&&!uncertainCase?'Escalated':review?'Review':'New';
 return {score,level,status,rules:rules.map(r=>r.name),cluster,evidence,barriers,components,uncertain:uncertainCase,
 reason:uncertainCase?'The narrative contains incomplete or unverified details. Human review is required before a safety decision.':controlOnly?'The narrative describes controls in place. This reduces the demo priority score but does not establish that the work is safe.':hasFailure?'The report describes a possible control failure alongside a hazardous activity. Review the highlighted source evidence.':'A hazardous activity is mentioned; verify the exposure and control status with the reporter.',
 worst:controlOnly?'No uncontrolled exposure is established by this narrative. Verify conditions before continuing.':rules[0]?.worst||'The narrative does not establish a specific fatal scenario. Obtain further context.',
 actions:controlOnly?['Verify the described controls remain effective.']:rules.length?[...new Set(rules.flatMap(r=>r.actions))].slice(0,4):['Request details about the activity, energy source, personnel exposure, and controls.'],
 related:related.length,version:'SENTINEL rules 0.1',method:'Deterministic demo rules'};
}
const templates=[
 ['Flange leak beside active hot work',DEMO_REPORT,'Hot Work'],
 ['Isolation bypass during pump maintenance','A technician found a hydrocarbon leak during pump maintenance. Positive isolation was not confirmed and two workers were at the energized pump.','Maintenance'],
 ['Unprotected access on elevated scaffold','Two workers were on a scaffold at 8 metres height without a harness. An open edge was missing a guardrail.','Working at Height'],
 ['Entry made without atmosphere verification','A contractor entered the tank in a confined space without a gas test. Oxygen status was unknown and no permit was available.','Confined Space'],
 ['Personnel beneath a suspended load','Crane lifting continued with workers beneath a suspended load. The exclusion barrier was missing and the sling was damaged.','Lifting'],
 ['Welding near a leaking hydrocarbon line','Workers were welding beside a hydrocarbon leak. The line was not isolated and the fire barrier was missing.','Hot Work'],
 ['Reversing vehicle without a spotter','A truck was reversing near a pedestrian walkway without a spotter. Two workers were inside the vehicle path.','Transport'],
 ['Fall protection connection unclear','A worker on a scaffold at height may have disconnected the harness. The fall arrest connection was unclear.','Working at Height'],
 ['Permit check before planned tank entry','Confined space entry was prevented. Gas testing was verified, isolation was confirmed and no workers entered the tank.','Confined Space'],
 ['Pre-job isolation verified','Pump maintenance started after isolation was verified. Lockout was confirmed and no leak was observed.','Maintenance'],
 ['Walkway housekeeping observation','Loose packaging was found beside the pedestrian walkway. It was removed and the access route was cleared.','General'],
 ['Lifting equipment inspection completed','Crane and sling inspection was completed. The lifting zone was barricaded and no personnel were beneath the load.','Lifting']
];
export function seedReports(){const reports=[];for(let i=0;i<36;i++){const t=templates[i%12];const date=new Date('2026-09-12T08:00:00+05:30');date.setDate(date.getDate()-Math.floor(i/3));const site=SITES[(i+Math.floor(i/12))%4];reports.push({id:`SNT-${String(1048-i).padStart(4,'0')}`,title:t[0],narrative:t[1],activity:t[2],site,date:date.toISOString(),source:'Sample dataset',...analyze(t[1],reports,site)});}return reports.map(r=>({...r,...analyze(r.narrative,reports.filter(x=>x.id!==r.id),r.site,r.date)}));}
export function similarReports(report,reports){const words=new Set(report.narrative.toLowerCase().match(/[a-z]{4,}/g)||[]);return reports.filter(r=>r.id!==report.id).map(r=>{const other=new Set(r.narrative.toLowerCase().match(/[a-z]{4,}/g)||[]);const same=[...words].filter(w=>other.has(w)).length;const union=new Set([...words,...other]).size;return {...r,similarity:Math.round((union?same/union:0)*100)};}).filter(r=>r.similarity>12).sort((a,b)=>b.similarity-a.similarity).slice(0,3);}
export function patterns(reports){const boundary=Date.now()-7*86400000;return ['Hot Work','Working at Height','Energy Isolation','Confined Space','Safe Mechanical Lifting','Driving'].map(name=>{const rows=reports.filter(r=>r.cluster===name&&r.score>=45);const recent=rows.filter(r=>new Date(r.date).getTime()>=boundary);const earlier=rows.filter(r=>new Date(r.date).getTime()<boundary);return{name,rows,count:rows.length,sites:new Set(rows.map(r=>r.site)).size,average:rows.length?Math.round(rows.reduce((s,r)=>s+r.score,0)/rows.length):0,recent:recent.length,earlier:earlier.length,change:earlier.length?Math.round((recent.length-earlier.length)/earlier.length*100):null};}).filter(p=>p.count>=2).sort((a,b)=>b.count-a.count);}
