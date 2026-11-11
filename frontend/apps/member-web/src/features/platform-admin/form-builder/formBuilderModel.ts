import { stableClientId } from '@/utils/stableId';
import type { DynamicFormDefinition, DynamicFormField, FormAuthoringDraft, FormFieldType } from '@/features/control-plane/types';

export const FORM_PURPOSES=['Visitor Registration','Member Profile','Business Profile','Event Registration','Opportunity','Due Diligence','Support'] as const;
export const FORM_FIELD_TYPES:FormFieldType[]=['text','textarea','number','currency','percentage','email','phone','date','datetime','checkbox','radio','select','multiselect','taxonomy','member','business','organisation','file','image','declaration','acknowledgement','address','repeater','table','calculated','hidden'];
export const OPTION_FIELD_TYPES=new Set<FormFieldType>(['radio','select','multiselect']);

export interface FormDraftValidation {formErrors:string[];fieldErrors:Record<string,string[]>;valid:boolean}

export const slugFormCode=(value:string)=>value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');
export const newFormId=()=>stableClientId('FORM');
export const newDraftId=()=>stableClientId('FORM-DRAFT');
export const newFieldId=(fields:DynamicFormField[])=>{let i=fields.length+1;while(fields.some(f=>f.id===`field${i}`))i+=1;return `field${i}`};

export function blankFormDefinition():DynamicFormDefinition{
 return {id:newFormId(),code:'',name:'',purpose:'Event Registration',description:'',targetModule:'events',targetEntity:'EventRegistration',instructions:'',confirmationMessage:'',version:1,status:'Draft',active:false,fields:[]};
}
export function draftFromDefinition(definition:DynamicFormDefinition):FormAuthoringDraft{
 const next:DynamicFormDefinition={...structuredClone(definition),version:definition.version+1,status:'Draft',active:false};
 return {id:newDraftId(),formId:definition.id,sourceVersion:definition.version,definition:next,savedAt:'',savedBy:''};
}
export function freshDraft():FormAuthoringDraft{
 const definition=blankFormDefinition();
 return {id:newDraftId(),formId:definition.id,definition,savedAt:'',savedBy:''};
}

export function validateFormDraft(definition:DynamicFormDefinition,existing:DynamicFormDefinition[],mode:'draft'|'release'='draft'):FormDraftValidation{
 const formErrors:string[]=[];const fieldErrors:Record<string,string[]>={};
 const code=definition.code.trim();const name=definition.name.trim();
 if(mode==='release'&&!name)formErrors.push('Form name is required before release.');
 if(mode==='release'&&!code)formErrors.push('Form code is required before release.');
 if(code&&!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(code))formErrors.push('Form code may contain lowercase letters, numbers, dots, underscores and hyphens.');
 if(code&&existing.some(f=>f.id!==definition.id&&f.code.toLowerCase()===code.toLowerCase()))formErrors.push(`Form code ${code} is already used by another form.`);
 if(mode==='release'&&!definition.fields.length)formErrors.push('Add at least one field before preparing a release.');
 const ids=definition.fields.map(f=>f.id.trim()).filter(Boolean);const duplicates=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
 for(const field of definition.fields){
  const errors:string[]=[];const id=field.id.trim();
  if(!id)errors.push('Field ID is required.');
  else if(!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id))errors.push('Field ID must start with a letter and use letters, numbers, underscore or hyphen.');
  if(duplicates.has(id))errors.push('Field ID must be unique within the form.');
  if(!field.label.trim())errors.push('Field label is required.');
  if(OPTION_FIELD_TYPES.has(field.type)){
   const opts=(field.options??[]).map(x=>x.trim()).filter(Boolean);
   if(mode==='release'&&!opts.length)errors.push(`${field.type} fields require at least one option.`);
   const lower=opts.map(x=>x.toLowerCase());if(new Set(lower).size!==lower.length)errors.push('Options must be unique.');
  }
  if(field.type==='taxonomy'&&!field.taxonomyDomain?.trim()&&mode==='release')errors.push('Taxonomy fields require a taxonomy domain.');
  if(field.validation){try{new RegExp(field.validation)}catch{errors.push('Validation pattern is not a valid regular expression.')}}
  if(field.condition&&!definition.fields.some(other=>other.id!==field.id&&field.condition?.includes(other.id))&&mode==='release')errors.push('Conditional expression must reference another field ID.');
  if(errors.length)fieldErrors[field.id||`field-${Object.keys(fieldErrors).length+1}`]=errors;
 }
 return {formErrors,fieldErrors,valid:formErrors.length===0&&Object.keys(fieldErrors).length===0};
}

export const formSnapshot=(draft:FormAuthoringDraft)=>JSON.stringify(draft.definition);
