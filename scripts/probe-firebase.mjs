const base='https://asia-southeast1-gvcn-3bdf9.cloudfunctions.net/gvcnApi';
const origin='https://gvcnva2.netlify.app';
const probes=[
  {name:'API health',url:base+'/health',options:{method:'GET',headers:{Origin:origin}}},
  {name:'Browser preflight',url:base+'/bootstrap',options:{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}}},
  {name:'Microsoft authentication guard',url:base+'/bootstrap',options:{method:'GET',headers:{Origin:origin}}},
];
const results=await Promise.all(probes.map(async probe=>{
  try {
    const response=await fetch(probe.url,{...probe.options,signal:AbortSignal.timeout(15000)});
    return {name:probe.name,status:response.status,cors:response.headers.get('access-control-allow-origin')===origin};
  } catch {return {name:probe.name,error:'Cannot reach endpoint.'};}
}));
for(const result of results) console.log(JSON.stringify(result));
if(results.some(r=>r.status===404)) {
  console.error('API endpoint returns 404: deploy gvcnApi in asia-southeast1 or check the configured function URL.');
  process.exitCode=1;
} else if(results.some(r=>r.error||!r.cors)) {
  console.error('Check connectivity and the deployed GVCN_ALLOWED_ORIGINS for gvcnva2.netlify.app.');
  process.exitCode=1;
} else if(results[0].status!==200||results[1].status!==204||results[2].status!==401) {
  console.error('API did not return the expected health/preflight/authentication responses.');
  process.exitCode=1;
} else console.log('API deployment, CORS and Microsoft authentication guard are responding.');
