var express = require('express');
var router = express.Router();
var user = require('../controllers/userController');
var fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: './public/uploads/'}).single('file');
var dbCongif = require('../util/dbconfig');
/* GET users listing. */
router.post('/sendCoreCode', user.sendCoreCode);
router.post('/codePhoneLogin', user.codePhoneLogin);
router.post('/sendCode', user.sendCode);
router.post('/login', user.login);
router.post('/editUserInfo', user.editUserInfo);
router.post('/editUserImg',upload,(req,res)=>{
    if (req.file.length === 0) {  //判断一下文件是否存在，也可以在前端代码中进行判断。
        res.render("error", {message: "上传文件不能为空！"});
        return
    } else {
       let file = req.file;
       let fileInfo = {};
       console.log(file);
       fs.renameSync('./public/uploads/' + file.filename, './public/uploads/' + file.originalname);//这里修改文件名字，比较随意。
    //    // 获取文件信息
    //    fileInfo.mimetype = file.mimetype;
    //    fileInfo.originalname = file.originalname;
    //    fileInfo.size = file.size;
    //    fileInfo.path = file.path;

       // 设置响应类型及编码
       res.set({
         'content-type': 'application/json; charset=utf-8'
      });
      let {user_id} = req.query;
      let imgUrl = 'http://localhost:3000/uploads/'+ file.originalname;
      let sql = 'update users set userpic=? where id=?';
      let sqlArr = [imgUrl, user_id];
      dbCongif.sqlConnect(sql, sqlArr,(err,data)=>{
          if(err){
            console.log(err);
            throw '出错了';
          }else{
            if(data.affecteRows==1){
                res.send({
                    'code':200,
                    'msg':'修改成功',
                    'url':imgUrl
                })
            }else{
                res.send({
                    'code':400,
                    'msg':'修改失败'
                })
            }
          }
      })
       res.end("上传成功！");
    }
});
module.exports = router;
