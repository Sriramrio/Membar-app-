export function converseThreadPath(conversationId:string,context?:string){
 const query=context?.trim()?`?context=${encodeURIComponent(context.trim())}`:'';
 return `/app/messages/${encodeURIComponent(conversationId)}${query}`;
}
