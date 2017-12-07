# web-storage
A  js libray for web storage

使用Store存储时的数据如下
```
{
    __start__:存储时的时间蹉,
    __data__ : 数据(String类型),
    __end__: 数据有效的截止时间蹉
}

```

### api介绍

`var store = new Store(options)`
`store.get(pathOrkey)`
`store.set(pathOrkey,val,options)`
`store.remove(key)`
`store.clearAllExpires()`

- path [String]  可以理解为一个路径 例如"a.b.c[1].d.[2]"
- key  [String] (不包含.[]字符)
- options [Object 配置信息]

#### options
|字段|类型|默认值|说明|
|-----|-----|-----|-----|
|Storage|String|"localStorage"|可选（"sessionStorage"）|
|exp|Number|3153600000（100年）|过期时间|
|serialize|Function|默认执行JSON.stringify|存储到Storage时会执行serialize,可用于加密数据|
|deserialize|Function|默认执行JSON.parse|从Storage取出来会执行deserialize,可用于解密数据|
|parseToArray|Bollean|true|path存在[]时,解析为数组(true)还是对象(false) (见例3)|
|polyfill|Object| {setItem, removeItem,getAllStorage}|在不支持localStorage的环境中可以通过实现3个函数，进行polyfill(例4用cookie进行polyfill)| 

```js

//先清除数据
localStorage.clear();  

//实例化,采用默认配置
var store = new Store(/*options*/);   

// 例1
store.set("db.userinfo.list","a userinfo list");
// db.userinfo.list 相当于一个取值操作的路径, set操作会强制根据'该路径'生成指定格式的对象(如下)
//=>
{
    db: "{
        "__start__":1512633833525,
        "__end__":316872633833525,
        "__data__":{
            "db":{
                "userinfo":{
                    "list":"a userinfo list"
                }
            }
        }"
}

// 例2
store.set("db.userinfo.list[2].name","julyL");
store.set("db.userinfo.id","10");
// list[2] 或者 list.[2]的写法默认是对数组进行操作,之前list的值为一个字符串(不是数组),会强制生成数组进行赋值 (也可以生成对象而不生成数组 见例3)
//=>
{
    db: "{
        "__start__":1512633833525,
        "__end__":316872633833525,
        "__data__":{
            "db":{
                "userinfo":{
                    "list":[null,null,{"name":"julyL"}]}
                },
                "id":"10"
            }
        }"
}

store.get("db.userinfo.list.[2].name");  //=> "julyL"

// 例3
var store1 = new Store({
    parseToArray:false
})

store.set("db.userinfo.id[2]","uid__2333");
// id被替换为了对象
//=> __data__部分   
{
    "db":{
        "userinfo":{
            "list":[null,null,{"name":"julyL"}]}
        },
        "id":{"2":"uid__2333"}
    }
}

//清除以上数据
localStorage.clear();

store.set("userinfo.name","julyL",{exp:60})   //设置60s的过期之间

store.get("userinfo")   //=>"julyL"  如果60s之后再进行store.get("userinfo")则会删除这条数据并且返回undefined

//可以删除指定数据
store.remove("userinfo")  

//也可以清除所有过期数据
store.clearAllExpires()


// 例4 待续...


```