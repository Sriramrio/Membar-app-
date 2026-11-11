export type PreviewAccountStatus='active'|'inactive'|'suspended'|'expired'|undefined;

export function canAuthenticateAccountStatus(status:PreviewAccountStatus){
  return !status||status==='active';
}

export function isSafeLocalReturnPath(value:string){
  if(!value||!value.startsWith('/')||value.startsWith('//'))return false;
  if(/[\u0000-\u001F\u007F]/.test(value))return false;
  try{
    const decoded=decodeURIComponent(value);
    if(decoded.startsWith('//')||decoded.includes('\\'))return false;
  }catch{return false;}
  return !value.includes('\\');
}
