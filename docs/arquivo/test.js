const title = '133C Resultados'; 
const regex = new RegExp(`(^|\\s|\\W)133C($|\\s|\\W)`, 'i'); 
console.log('regex:', regex, 'result:', regex.test(title));
