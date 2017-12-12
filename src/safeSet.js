/**
 * @param {处理的对象} obj 
 * @param {路径:数组或者字符串} path 
 * @param {设置的值} val 
 * @param {当键值为正数字时,生成数组覆盖} toArray 
 * 思路:
 * obj表示对象  k:表示key  result:需要赋值的值  取值: 即点操作(obj.key)
 * 判断obj能否取值 
 *      * 能取值(obj是对象)  
 *               * 如果k已经是最后一个了,直接obj[k]=result
 *               * 如果不是并且当前对象不能进行取值,则根据key值和newArrayIfNeed  返回{}或[] 
 *      * 不能取值,则根据key值和newArrayIfNeed 新建{}或[]  
 *               * 如果k已经是最后一个了,直接obj[k]=result
 *               * 如果不是并且当前对象不能进行取值,则根据key值和newArrayIfNeed  返回{}或[] 
 */

/**
 * 如果key为正整数,并且newArrayIfNeed为true则返回[],否则返回{}
 * @param {String|Number} key 
 * @param {Boolean} newArrayIfNeed 
 * @returns 
 */
function _newObjectOrArray(key, newArrayIfNeed) {
  if (newArrayIfNeed && parseInt(key) == key && /^(([1-9]\d*)|0)$/.test(key)) {
    return new Array(parseInt(key)); //  因为new Array("1") => ["1"] ,所以需要parseInt处理一下   
  } else {
    return {};
  }
}

function safeSet(data, path, result, newArrayIfNeed) {
  if (Array.isArray(path)) {
    var ob = data,
      ArrayObj = [],  // 用于存储每个data每个取值之后的值(除最后一个,其他值必定为引用值{}或[]) 从而ArrayObj[0]即为修改之后的值
      key,
      val;
    for (var i = 0, len = path.length; i <= len - 1; i++) {
      key = path[i];
      if (typeof ob == "object" && ob != null) { 
        ArrayObj.push(ob);
        val = ob[key];
        if (i == len - 1) {       // 例1
          ob[key] = result;
        } else if (!val || typeof val != "object") {     //例2
          ob[key] = _newObjectOrArray(path[i + 1], newArrayIfNeed);
        }
      } else {
        ob = _newObjectOrArray(key, newArrayIfNeed);
        ArrayObj.push(ob);
        if (i == len - 1) {       //例3
          ob[key] = result;
        } else {                  //例4
          ob[key] = _newObjectOrArray(path[i + 1], newArrayIfNeed);
        }
      }
      ob = ob[key];
    }
    return ArrayObj[0];
  } else if (typeof path == "string") { // 解析path为数组    list[2].user.[3]  =>  ['list','2','user',3]
    var splitArr = path.split("."),
      pathKeyArr = [],
      k;
    splitArr.forEach(key => {
      if ((k = key.match(/([^\[\]]+)|(\[\d+\])/g))) { // list[2]  => ['list','[2]']
        k = k.map(v => v.replace(/\[(\d+)\]/, "$1")); // [2] => 2  
        [].push.apply(pathKeyArr, k);
      }
    });
    return safeSet(data, pathKeyArr, result, newArrayIfNeed);
  }
}
/*

//例1:
var data = {b:1}; 
safeSet(data,'b',2);  //=> {b:2}

//例2:
var data = {b:1}; 
// safeSet(data,'b.1',2);  //=> {b:{1:2}}
// safeSet(data,'b.1',2,true);  //=> {b:[,2]}

//例3:
var data = 1; 
//safeSet(data,'b',2);  //=> {b:2}
//safeSet(data,'1',2);  //=> {1:2}
//safeSet(data,'1',2,true);  //=> [,2]

//例4:
var data = 1; 
//safeSet(data,'b.c',2);   //=> {b:{c:2}}
//safeSet(data,'b.1',2);   //=> {b:{1:2}}
//safeSet(data,'b.1',2,true);   //=> {b:[,2]}

*/
export default safeSet;