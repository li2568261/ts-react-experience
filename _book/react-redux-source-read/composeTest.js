// const fucArr = [next=>{
//   setTimeout(()=>{
//     console.log(1);
//     next()
//   }, 300)
// },
// next=>{
//   setTimeout(()=>{
//     console.log(2);
//     next()
//   }, 200)
// },
// next=>{
//   setTimeout(()=>{
//     console.log(3);
//     next()
//   }, 100)
// }]

// var statusRecord = fucArr[0];
// for (let index = 1; index < fucArr.length; index++) {
//   const current = fucArr[index];
//   statusRecord = ((statusRecord)=>(arg)=>statusRecord(()=>current(arg)))(statusRecord)
// }
// statusRecord(()=>{})

// fucArr.reduce((pre,cur)=>{
//   return (next)=>pre(()=>cur(next))
// })(()=>{})

// const fucArr = [
//   next=>{
//       setTimeout(()=>{
//         console.log(1);
//         next(2)
//       }, 300)
//   },
//   // 函数2
//   (next,n)=>{
//   console.log(n);
//       next(3)
//   },
//   // 函数3
//   (next,n)=>{
//   console.log(n);
//       next(4)
//   }
// ]

// fucArr.reduce((pre,cur)=>{
//   return (next)=>pre((n)=>cur(next,n))
// })((n)=>{console.log(n)})

const fucArr = [
  next=>n=>{
    setTimeout(()=>{
      console.log(n);
      next(n+1)
    }, 300)
  },
  // 函数2
  next=>n=>{
    setTimeout(()=>{
      console.log(n);
      next(n+1)
    }, 300)
  },
  // 函数3
  next=>n=>{
    setTimeout(()=>{
      console.log(n);
      next(n+1)
    }, 300)
  }
]

fucArr.reduce((pre,cur)=>{
  return (next)=>pre(cur(next))
})((n)=>{console.log(n)})(1)// 1 2 3 4