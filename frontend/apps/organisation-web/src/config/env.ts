const bool=(value:string|undefined,defaultValue=false)=>value===undefined?defaultValue:value==='true';
export const env={
  apiBaseUrl:import.meta.env.VITE_API_BASE_URL||'https://sethudbnapi.dharmicbusines.com',
  useMocks:bool(import.meta.env.VITE_USE_MOCKS,false),
  realtimeUrl:import.meta.env.VITE_REALTIME_URL||'https://sethudbnapi.dharmicbusines.com/v3/organisational/stream',
  appMode:import.meta.env.VITE_APP_MODE||(import.meta.env.PROD?'production':'development'),
  telemetryEndpoint:import.meta.env.VITE_TELEMETRY_ENDPOINT||'',
  buildRevision:import.meta.env.VITE_BUILD_REVISION||'live-backend'
};
