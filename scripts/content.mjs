import fs from 'node:fs';
import Ajv from 'ajv';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const districts = read('src/data/districts.json');
const tourism = read('src/data/tourism.json');
const schema = { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', required:['version','items'], additionalProperties:false, properties:{version:{const:3}, items:{type:'array',items:{type:'object',required:['id'],properties:{id:{type:'string',minLength:1}}}}}};
fs.mkdirSync('public/data', { recursive:true });
fs.writeFileSync('public/data/schema.json', JSON.stringify(schema,null,2));
const validate = new Ajv().compile(schema);
const collections = {districts,...tourism};
const sourceIds = new Set(tourism.sources.map(s=>s.id));
const districtIds = new Set(districts.map(d=>d.id));
if(districtIds.size!==64 || tourism.divisions.length!==8) throw Error('Incomplete district/division register');
function banglaDigits(value,path='') {
  if (!value || typeof value !== 'object') return;
  for(const [key,v] of Object.entries(value)) {
    if(key==='bn' && typeof v==='string' && /[0-9]/.test(v)) throw Error(`Latin digit in Bangla: ${path}`);
    if(typeof v==='object') banglaDigits(v,`${path}.${key}`);
  }
}
for(const [name,items] of Object.entries(collections)) {
  const file = {version:3,items};
  if(!validate(file)) throw Error(JSON.stringify(validate.errors));
  if(new Set(items.map(i=>i.id)).size!==items.length) throw Error(`Duplicate id: ${name}`);
  banglaDigits(items,name);
  for(const item of items) {
    for(const id of item.sourceIds || []) if(!sourceIds.has(id)) throw Error(`Missing source ${id}`);
    if(item.district && !districtIds.has(item.district)) throw Error(`Missing district ${item.district}`);
    for(const id of item.regions || []) if(!districtIds.has(id)) throw Error(`Missing food district ${id}`);
    if(item.lat!==undefined && (item.lat<20 || item.lat>27 || item.lng<88 || item.lng>93)) throw Error(`Invalid coordinate ${item.id}`);
  }
  fs.writeFileSync(`public/data/${name}.json`, JSON.stringify(file));
}
console.log(`Validated ${districts.length} districts, ${tourism.attractions.length} attractions, ${tourism.foods.length} foods, ${tourism.sources.length} sources`);
