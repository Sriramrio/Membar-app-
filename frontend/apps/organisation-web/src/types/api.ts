export type ApiErrorType='VALIDATION'|'AUTHENTICATION'|'AUTHORIZATION'|'NOT_FOUND'|'CONFLICT'|'GONE'|'RATE_LIMIT'|'DEPENDENCY'|'OFFLINE'|'CANCELLED'|'UNKNOWN';
export interface ApiErrorEnvelope{
  type:ApiErrorType;
  code:string;
  title:string;
  detail:string;
  status:number;
  correlationId?:string;
  retryable:boolean;
  fieldErrors?:Array<{field:string;message:string}>;
  currentVersion?:number;
  allowedRecovery?:string[];
  unknownOutcome?:boolean;
}
