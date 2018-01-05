# l-store
> 对Web Storage(localStorage,sessionStorage)方法进行了封装和扩展, 支持设置过期时间, 主要特点是支持根据“路径”进行设值和取值操作。例如："a.b[2].c"


### Useage
> npm install l-store -S

```js
const Store = require("l-store");
// 或者直接引入  ./dist/lStore.js
```

### options的字段说明
|字段|类型|默认值|说明|
|-----|-----|-----|-----|
|Storage|String|"localStorage"|可选（"sessionStorage"）|
|exp|Number|31536000(100年)|过期时间(时间单位:秒)|
|serialize|Function|默认执行JSON.stringify|存储到Storage时会执行serialize,可用于加密数据|
|deserialize|Function|默认执行JSON.parse|从Storage取出来会执行deserialize,可用于解密数据|

Web Storage存储时的数据格式如下
```
{
    __start__:存储时的时间蹉,
    __data__ : 存储的数据(String类型),
    __end__: 数据有效的截止时间蹉
}
```
#### 代码示例
```javascript
const lStore = require("l-store");
var store = new lStore(/*options*/);   //实例化,采用默认配置

// set("路径"，值，/*可选配置，只能设置exp*/)
store.set("db.userinfo.list[2].name","julyL");   
store.set("db.userinfo.id","10");
// 如果无法根据“路径”获取到值,则会根据“路径”生成相应的对象或者数组。
// 生成原理:“路径”中以.或者[]分隔的会被解析为属性,[]中有数字则会解析成数组。
// 上面的代码执行后,localStorage的结构如下:  localStorage中存储的键为“路径”解析后的第一个属性,这里是db
// => {
//     db: "{
//         "__start__":'Fri, 05 Jan 2018 05:37:12 GMT',
//         "__end__":'Fri, 05 Jan 2118 05:37:12 GMT',
//         "__data__":{
//             "db":{
//                 "userinfo":{
//                     "list":[null,null,{"name":"julyL"}]}    // 注意： list[2]会解析成长度为3的数组，由于我们只设置了第3个值，其余未设置的空值会用null进行填充
//                 },
//                 "id":"10"
//             }
//         }"
// }


store.get("db.userinfo.list.[2].name");  //=> "julyL"

store.set("a.b","1",{ exp :60 })   // 设置60s的过期之间

store.get("a")   //=>"1"  如果60s之后再进行store.get("userinfo")则会删除这条数据并且返回undefined

// 从localStoarge中删除指定的键
store.remove("a")  

// 清除所有过期数据
store.clearAllExpires()


```