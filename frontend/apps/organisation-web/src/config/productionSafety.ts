import {env} from './env';
export function assertProductionSafety(){
  if(import.meta.env.PROD&&env.useMocks)throw new Error('Production startup blocked: preview/mock mode is enabled.');
  if(import.meta.env.PROD&&env.appMode!=='production')throw new Error('Production startup blocked: VITE_APP_MODE must be production.');
  if(import.meta.env.PROD&&!env.apiBaseUrl.trim())throw new Error('Production startup blocked: API base URL is missing.');
}
