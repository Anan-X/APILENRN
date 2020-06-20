var dbCongif = require('../util/dbconfig.js')
// 获取users用户表
getcate = (req, res) => {
    var sql = "select * from users"
    var sqlArr = []
    var callBack = (err, data) => {
        if(err){
        console.log('连接出错')
        }else{
        res.send({
            'list': data
        })
        }
    }
    dbCongif.sqlConnect(sql, sqlArr, callBack)
}
getpost = (req, res) => {
    let {id} = req.query
    var sql = "select * from post where cate_id=?"
    var sqlArr = [id]
    var callBack = (err, data) => {
        if(err){
        console.log('连接出错')
        }else{
        res.send({
            'list': data
        })
        }
    }
    dbCongif.sqlConnect(sql, sqlArr, callBack)
}
module.exports = {
    getcate,
    getpost
}