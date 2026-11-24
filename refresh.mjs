import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {basename} from 'node:path';
import {extract} from './extract.mjs';
try {
 const args=process.argv.slice(2); const save=args.shift();
 if(!save || !/^character\d+\.ksd$/i.test(basename(save))) throw Error('Usage: node refresh.mjs <characterN.ksd> [--prior <JSON>] [--flame <1-11>] [--weapon <bar:slot>]');
 const opts={}; while(args.length){const k=args.shift();if(!['--prior','--flame','--weapon'].includes(k)||!args.length||Object.hasOwn(opts,k))throw Error('Invalid option: '+k);opts[k]=args.shift();}
 const valid=n=>Number.isInteger(n)&&n>=1&&n<=11;
 let flame=5, source='default';
 if(opts['--prior']){let old=JSON.parse(fs.readFileSync(opts['--prior'],'utf8').replace(/^\uFEFF/,''));if(valid(old.flameLevel)){flame=old.flameLevel;source='previous-published-build';}}
 if(opts['--flame']!==undefined){flame=Number(opts['--flame']);if(!valid(flame))throw Error('Invalid Flame level');source='manual';}
 const sig=s=>[s.size,s.mtimeNs,s.ctimeNs,s.ino].join(':');
 let data,stat,last;
 for(let i=0;i<3;i++){try{stat=fs.statSync(save,{bigint:true});const raw=fs.readFileSync(save);if(sig(stat)!==sig(fs.statSync(save,{bigint:true}))||BigInt(raw.length)!==stat.size)throw Error('Save changed during read');data=extract(raw,flame);data.snapshot={saveFile:basename(save),saveModifiedAt:new Date(Number(stat.mtimeMs)).toISOString(),readAt:new Date().toISOString(),saveSha256:createHash('sha256').update(raw).digest('hex')};break;}catch(e){last=e;if(i<2)await new Promise(r=>setTimeout(r,2000));}}
 if(!data)throw last;
 data.flameLevelSource=source;
 if(opts['--weapon']){const w=data.hotbarWeapons.find(w=>`${w.hotbar}:${w.hotbarSlot}`===opts['--weapon']);if(!w)throw Error('Requested hotbar slot does not contain a decoded weapon');data.selectedWeapon=w;data.selectedWeaponSource='explicit-hotbar-slot';}
 console.log(JSON.stringify(data,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
