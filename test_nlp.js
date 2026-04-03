const nlp = require('compromise');
console.log(nlp('running').has('#Verb'));
console.log(nlp('running').verbs().toInfinitive().text());
console.log(nlp('apples').has('#Verb'));
