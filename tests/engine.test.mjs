import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyState,newSession,score,recordQuestions,finishSession,reviewIds,remainingSeconds,optionDisplayText,groupMistakes} from '../web/engine.js';
const bank=JSON.parse(await readFile(new URL('../web/data/test1.json',import.meta.url),'utf8'));
test('Part 1/2 option sentences stay hidden until reveal; other parts stay visible',()=>{
 for(const q of bank.questions)for(const o of q.options){
  assert.equal(optionDisplayText(q,o,false),q.part<=2?'':o.text);
  assert.equal(optionDisplayText(q,o,true),o.text);
 }
});
test('mistakes form two categories without changing saved records or losing resolved items',()=>{
 const records={};
 for(let part=1;part<=7;part++)records[part]={part,tag:`old-tag-${part}`,wrongCount:part,lastAt:part,resolved:part===2};
 const original=structuredClone(records),groups=groupMistakes(records);
 assert.deepEqual(groups.listening.map(m=>m.part),[4,3,1]);
 assert.deepEqual(groups.reading.map(m=>m.part),[7,6,5]);
 assert.equal(groupMistakes(records,false).listening.length,4);
 assert.deepEqual(records,original);
 assert.deepEqual(groupMistakes({}),{listening:[],reading:[]});
});
test('scopes contain 200 / 100 / 100 original questions',()=>{for(const scope of ['full','listening','reading'])assert.equal(newSession(bank,scope).ids.length,scope==='full'?200:100);});
test('scores count unanswered separately and do not invent official points',()=>{const s=newSession(bank,'reading');s.answers['t1-q101']='D';s.answers['t1-q102']='A';const r=score(s,bank);assert.equal(r.correct,1);assert.equal(r.answered,2);assert.equal(r.unanswered,98);});
test('reveal then submit does not double count mistakes',()=>{const state=emptyState();state.active=newSession(bank,'reading');state.active.answers['t1-q101']='A';recordQuestions(state,state.active,bank,['t1-q101']);finishSession(state,bank);assert.equal(state.mistakes['t1-q101'].wrongCount,1);assert.equal(state.history.length,1);assert.equal(state.active,null);assert.equal(finishSession(state,bank),null);});
test('two independent correct reviews resolve a mistake',()=>{const state=emptyState();for(const a of ['A','D','D']){state.active=newSession(bank,'reading');state.active.answers['t1-q101']=a;finishSession(state,bank);}assert.equal(state.mistakes['t1-q101'].resolved,true);assert.equal(state.mistakes['t1-q101'].wrongCount,1);});
test('wrong question review retains whole passage or conversation',()=>{assert.deepEqual(reviewIds(bank,['t1-q133']),['t1-q131','t1-q132','t1-q133','t1-q134']);assert.deepEqual(reviewIds(bank,['t1-q33']),['t1-q32','t1-q33','t1-q34']);});
test('reading timer is based on deadline, including reload or background time',()=>{const s=newSession(bank,'reading','exam');assert.equal(remainingSeconds(s,s.deadline-1234),2);assert.equal(remainingSeconds(s,s.deadline+10),0);assert.equal(remainingSeconds(newSession(bank,'reading','practice')),null);});
