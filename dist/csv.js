export function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted){quoted=false;}else if(!cell){quoted=true;}else throw new Error('Unexpected quote in CSV field.');}
 else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;
 }
 if(quoted)throw new Error('A quoted CSV field is not closed.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw new Error('Include a header and at least one report.');
 const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,'').trim().toLowerCase());
 if(!headers.includes('narrative'))throw new Error('The CSV needs a narrative column. Optional columns: title, site, activity, date.');
 if(new Set(headers).size!==headers.length)throw new Error('CSV column names must be unique.');
 if(rows.length>200)throw new Error('Import up to 200 reports at a time.');
 return rows.map((r,i)=>{if(r.length!==headers.length)throw new Error(`Row ${i+2} has ${r.length} fields; expected ${headers.length}.`);const v=Object.fromEntries(headers.map((h,j)=>[h,r[j].trim()]));if(v.narrative.length<20||v.narrative.length>8000)throw new Error(`Row ${i+2}: narrative must contain 20–8,000 characters.`);if(v.date&&!/^\d{4}-\d{2}-\d{2}$/.test(v.date))throw new Error(`Row ${i+2}: use YYYY-MM-DD for date.`);if(v.date&&(Number.isNaN(Date.parse(v.date))||new Date(v.date).toISOString().slice(0,10)!==v.date))throw new Error(`Row ${i+2}: invalid date.`);return v;});
}
export function toCSV(rows){return rows.map(row=>row.map(value=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}
