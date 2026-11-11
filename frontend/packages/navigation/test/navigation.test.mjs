import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDestination, validateRouteRegistry, resolveWorkspaceRoute, filterVisibleRoutes, fallbackReturn, assertWorkspace} from '../src/index.js';
const routes=[{id:'dashboard',path:'/platform-admin/dashboard',permission:'dashboard'},{id:'member',path:'/platform-admin/member/:memberId',permission:'read',parentId:'dashboard'}];
test('resolves actual workspace-style route paths and encodes parameters',()=>{ assert.equal(resolveWorkspaceRoute('platform-admin',routes,'member',{memberId:'A B'}),'/platform-admin/member/A%20B');assert.equal(buildDestination('/org/chapter/:id',{id:'Chennai 1'}),'/org/chapter/Chennai%201');});
test('filters navigation by permission without changing order or mutating routes',()=>{const before=JSON.stringify(routes);assert.deepEqual(filterVisibleRoutes(routes,['read']),[routes[1]]);assert.equal(JSON.stringify(routes),before);assert.deepEqual(filterVisibleRoutes(routes,[]),[]);});
test('rejects malformed and external destinations',()=>{for(const x of ['https://example.com','//evil.example','/x?y=1','relative'])assert.throws(()=>buildDestination(x));for(const x of ['', '../root','one/two'])assert.throws(()=>buildDestination('/org/:id',{id:x}));});
test('rejects invalid workspace, missing route, duplicates, missing parents',()=>{assert.throws(()=>assertWorkspace('governance-admin'));assert.throws(()=>resolveWorkspaceRoute('member',routes,'missing'));assert.throws(()=>buildDestination('/x/:id'));assert.throws(()=>validateRouteRegistry('platform-admin',[routes[0],routes[0]]));assert.throws(()=>validateRouteRegistry('platform-admin',[{...routes[1],id:'new'}]));});
test('valid registry and safe return fallback',()=>{assert.equal(validateRouteRegistry('platform-admin',routes),true);assert.equal(fallbackReturn('//other','/platform-admin/dashboard'),'/platform-admin/dashboard');});

test('resolves repeated route placeholders without dropping later occurrences',()=>{
 assert.equal(buildDestination('/chapters/:id/related/:id',{id:'C 42'}),'/chapters/C%2042/related/C%2042');
});
test('rejects dot traversal and encoded separators in templates',()=>{
 for(const route of ['/../admin','/./admin','/org/%2e%2e/admin','/org/%2fadmin','/org/%5cadmin','/org\\admin']) assert.throws(()=>buildDestination(route));
});
test('rejects invalid parameter types and accepts finite numeric IDs',()=>{
 assert.equal(buildDestination('/member/:id',{id:42}),'/member/42');
 for(const id of [Infinity,NaN,{},null]) assert.throws(()=>buildDestination('/member/:id',{id}));
});
