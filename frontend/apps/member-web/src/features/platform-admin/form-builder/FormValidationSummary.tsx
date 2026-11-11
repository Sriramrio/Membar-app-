import type { FormDraftValidation } from './formBuilderModel';
export function FormValidationSummary({validation}:{validation:FormDraftValidation}){
 const fieldEntries=Object.entries(validation.fieldErrors);
 if(!validation.formErrors.length&&!fieldEntries.length)return null;
 return <div role="alert" aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><div className="font-black">Review the form before continuing</div><ul className="mt-2 list-disc space-y-1 pl-5">{validation.formErrors.map((x,i)=><li key={`form-${i}`}>{x}</li>)}{fieldEntries.flatMap(([field,errors])=>errors.map((x,i)=><li key={`${field}-${i}`}><strong>{field}:</strong> {x}</li>))}</ul></div>
}
