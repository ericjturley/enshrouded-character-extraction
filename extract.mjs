import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {zstdDecompressSync} from 'node:zlib';
import {parseCharacter} from './vendor/character.mjs';
const items=JSON.parse(fs.readFileSync(new URL('./data/items.json',import.meta.url)));
const nodes=JSON.parse(fs.readFileSync(new URL('./data/skills.json',import.meta.url))).nodes;
const allowed=new Set(['Armour_Head','Armour_UpperBody','Armour_Arms','Armour_LowerBody','Armour_Feet','Armour_Ring','Shield','HookShot','Glider','Backpack']);
export function extract(data, flameLevel=null){
 if(flameLevel!==null&&(!Number.isInteger(flameLevel)||flameLevel<1||flameLevel>11))throw Error("Flame level must be 1–11");
 if(data.toString('latin1',0,4)!=='SV2C')throw Error('Invalid SV2C');
 const offset=data.readUInt32LE(40)+40,count=data.readUInt32LE(44), blocks={};
 if(count>10000||offset+20*count>data.length)throw Error('Invalid block directory');
 for(let i=0;i<count;i++){
 const e=offset+20*i,n=e+data.readUInt32LE(e),len=data.readUInt32LE(e+4),off=data.readUInt32LE(e+8),size=data.readUInt32LE(e+12);
 if(n+len>data.length||off+size>data.length||size<14)throw Error('Incomplete block');
 const name=data.toString('utf8',n,n+len),raw=data.subarray(off,off+size);
 if(raw.toString('latin1',0,4)!=='S2BH')throw Error('Invalid block signature');
 if(['character_data','player_character'].includes(name))blocks[name]=raw[9]===1?zstdDecompressSync(raw.subarray(14)):raw.subarray(14);
 }
 const c=parseCharacter(blocks.player_character,id=>Object.hasOwn(items,id),id=>Object.hasOwn(nodes,id),id=>allowed.has(items[id]?.slot));
 const enrich=e=>({...e,name:items[e.itemId]?.en,debug:items[e.itemId]?.debug,gearSlot:items[e.itemId]?.slot,catalogRarity:items[e.itemId]?.rarity,rarity:e.maxUpgrades!==undefined?([null,'Common','Uncommon','Rare','Epic','Legendary'][e.maxUpgrades]??null):(items[e.itemId]?.rarity??null),raritySource:e.maxUpgrades!==undefined?'save-maxUpgrades':'catalog-fallback'});
 const cd=blocks.character_data;
 const skills=c.skills.map(s=>({...s,name:nodes[s.id].en,class:nodes[s.id].class,type:nodes[s.id].type}));
 const allocated=skills.filter(s=>s.level>0&&s.type!=='Root');
 const direct=Object.fromEntries(['Strength','Constitution','Dexterity','Intelligence','Endurance','Spirit'].map(n=>[n,allocated.filter(s=>s.type==='Attribute'&&s.name===n).reduce((a,s)=>a+s.level,0)]));
 const hotbarWeapons=c.main.filter(e=>e.slot>=16&&e.slot<32).map(enrich).filter(e=>['MeleeWeapon','RangeWeapon','MidRangeWeapon'].includes(e.gearSlot)&&! /^(Tool_|Consumable_)/.test(e.debug||'')).map(e=>({...e,hotbar:1+Math.floor((e.slot-16)/8),hotbarSlot:1+(e.slot-16)%8})).sort((a,b)=>a.slot-b.slot);
 const flameBonus=flameLevel===null?null:flameLevel-1;
 const barbarian=allocated.some(s=>s.name==='Barbarian');
 const flameScaled=flameLevel===null?null:{Strength:barbarian?Math.floor(flameLevel/2):0};
 const calculated=flameBonus===null?null:Object.fromEntries(Object.entries(direct).map(([k,v])=>[k,v+flameBonus+(flameScaled[k]??0)]));
 return {schemaVersion:3,character:{name:cd?.length>=9?cd.toString('utf8',9,9+Math.min(cd.readUInt32LE(5),64)):null,level:c.level,xp:c.xp},attributeBonusesFromDirectSkills:direct,flameLevel,flameLevelSource:flameLevel===null?null:"manual",attributeBonusesFromFlame:flameBonus,attributeBonusesFromFlameScaledSkills:flameScaled,calculatedAttributesBeforeGearAndFood:calculated,characterSheetAttributes:null,skills:allocated.filter(s=>!(s.type==='Attribute'&&Object.hasOwn(direct,s.name))).map(s=>({...s,description:nodes[s.id].descEn})),rawAllocatedSkills:allocated,equipment:c.equipment.map(enrich),hotbarWeapons,selectedWeapon:hotbarWeapons[0]??null,selectedWeaponSource:'default-first-weapon-in-hotbar-order'};
}
if(process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url && process.argv[2]) {try{console.log(JSON.stringify(extract(fs.readFileSync(process.argv[2]),process.argv[3]===undefined?null:Number(process.argv[3])),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
