# l-store
Web Storage的操作封装（支持localStorage，sessionStorage）支持设置过期时间和“路径”取值赋值

### Install
`npm install l-store -S`

### Useage
```
//实例化
var store = new Store(options)  

//根据path取值
store.get(path)

//根据path设置val,opts仅支持设置过期时间exp
store.set(path,val,opts)   

//删除键值
store.remove(key)

// 清除过期数据
store.clearAllExpires()

key  [String] (不包含.[]字符)
path [String]  可以理解为一个路径 例如"a.b.c[1].d.[2]" ,也可以是key
options [Object 配置信息]
opts 仅支持设置过期时间exp 
```
#### options的字段说明
|字段|类型|默认值|说明|
|-----|-----|-----|-----|
|Storage|String|"localStorage"|可选（"sessionStorage"）|
|exp|Number|31536000000(100年)|过期时间|
|serialize|Function|默认执行JSON.stringify|存储到Storage时会执行serialize,可用于加密数据|
|deserialize|Function|默认执行JSON.parse|从Storage取出来会执行deserialize,可用于解密数据|

使用Store存储时的数据如下
```
{
    __start__:存储时的时间蹉,
    __data__ : 存储的数据(String类型),
    __end__: 数据有效的截止时间蹉
}
```

#### 代码示例
```javascript

//实例化,采用默认配置
var store = new Store(/*options*/);   

store.set("db.userinfo.list","a userinfo list");
// db.userinfo.list 相当于一个取值操作的路径, set操作会强制根据'该路径'生成指定格式的对象(如下)
// => {
//     db: "{
//         "__start__":1512633833525,
//         "__end__":316872633833525,
//         "__data__":{
//             "db":{
//                 "userinfo":{
//                     "list":"a userinfo list"
//                 }
//             }
//         }"
// }

store.set("db.userinfo.list[2].name","julyL");   // 路径中存在[num]会解析成数组
store.set("db.userinfo.id","10");
// => {
//     db: "{
//         "__start__":1512633833525,
//         "__end__":316872633833525,
//         "__data__":{
//             "db":{
//                 "userinfo":{
//                     "list":[null,null,{"name":"julyL"}]}
//                 },
//                 "id":"10"
//             }
//         }"
// }

store.get("db.userinfo.list.[2].name");  //=> "julyL"

store.set("userinfo.name","julyL",{exp:60})   //设置60s的过期之间

store.get("userinfo")   //=>"julyL"  如果60s之后再进行store.get("userinfo")则会删除这条数据并且返回undefined

// 删除指定数据
store.remove("userinfo")  

// 清除所有过期数据
store.clearAllExpires()



```