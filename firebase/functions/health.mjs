import {YEAR} from './model.mjs';

// Configuration readiness only. Never return credentials, tokens or student data.
export function deploymentStatus(env=process.env) {
  const guid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  const microsoftConfigured=guid.test(String(env.MICROSOFT_TENANT_ID||'').trim()) &&
    guid.test(String(env.MICROSOFT_CLIENT_ID||'').trim());
  const allowedOriginsConfigured=String(env.GVCN_ALLOWED_ORIGINS||'').split(',').some(value=>{
    try {const origin=value.trim();return !!origin && new URL(origin).origin===origin;}
    catch {return false;}
  });
  return {service:'vietanh-gvcn-api',year:YEAR,configured:microsoftConfigured&&allowedOriginsConfigured,
    microsoftConfigured,allowedOriginsConfigured};
}
