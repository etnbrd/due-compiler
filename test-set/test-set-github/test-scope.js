var obj = {
  a: 2
}
var arr = [obj];

setTimeout(function(a) {
  a.a = 6;

  console.log('#4 (6) ' + arr[0]['a'] + ' ' + obj['a']);

}, 0, arr[0]);

// function test1() {
//   var a = 1;

//   function test() {
//     console.log(a);
//   }
  
//   test();
// }

// function test2() {
//   var a = 2;
  
//   function test() {
//     console.log(a);
//   }

//   test();
// }

// test1();
// test2();










