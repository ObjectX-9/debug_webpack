import foo from './foo.js';
import { isEmpty } from 'lodash';

foo();

const obj = {};
console.log(isEmpty(obj));
console.log('main.js');
