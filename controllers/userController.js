var Core = require('@alicloud/pop-core');
var config = require('../util/aliconfig');
var dbCongif = require('../util/dbconfig');
// 配置
let client = new Core(config.alicloud)
let requestOption = {
  method: 'POST'
};

// 生成随机码
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
validatePhoneCode = [];
// 判断手机号是否发送验证码
let sendCodePhone = (phone) => {
  for (let item of validatePhoneCode) {
    if (item.phone == phone) return true;
  }
  return false
}
// 判断手机号和验证码是否匹配
let findCodePhone = (phone, code) => {
  for (let item of validatePhoneCode) {
    if (item.phone == phone && item.code == code) return 'login';
  }
  return false;
}
// 模拟验证码发送接口
sendCode = (req, res) => {
  let phone = req.query.phone;
  if (sendCodePhone(phone)) {
    res.send({
      'code': 400,
      'msg': '已经发送过验证码，稍后重试'
    })
  }
  let code = rand(1000, 9999);
  validatePhoneCode.push({
    'phone': phone,
    'code': code
  })
  console.log(validatePhoneCode);
  res.send({
    'code': 200,
    'msg': '发送成功'
  })
  console.log(code);
}
// 发送验证码接口
sendCoreCode = (req, res) => {
  let phone = req.query.phone;
  let code = rand(1000, 9000);
  let params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phone,
    "SignName": "莲美App",
    "TemplateCode": "SMS_192195277",
    "TemplateParam": JSON.stringify({
      'code': code
    })
  }
  client.request('SendSms', params, requestOption).then((result) => {
    console.log('1')
    console.log(JSON.stringify(result));
    if (result.Code == 'OK') {
      res.send({
        'code': 200,
        'msg': '发送成功'
      });
      validatePhoneCode.push({
        'phone': phone,
        'code': code
      });
      console.log(code);
    } else {
      res.send({
        'code': 400,
        'msg': '发送失败'
      });
    }
  }, (ex) => {
    console.log(ex);
  })
}
// 检测验证码登录是否是第一次登录
let phoneLoginBind = async (phone) => {
  let sql = `select * from users where username=? or phone=?`;
  let sqlArr = [phone, phone];
  let res = await dbCongif.SySqlConnect(sql, sqlArr);
  console.log("查询" + res.length)
  if (res.length) {
    res[0].userinfo = await getUserInfo(res[0].id);
    return res
  } else {
    // 用户第一次注册，绑定表 // 用户注册
    let res = await regUser(phone);
    console.log("注册" + res);
    res[0].userinfo = await getUserInfo(res[0].id);
    // 获取用户详情
    return res
  }
}
// 用户注册
let regUser = async (phone) => {
  // 检测用户书否已经被注册过
  let userpic = ''; //头像
  let sql = `insert into users(username,userpic,phone,create_time) value(?,?,?,?)`;
  let sqlArr = [phone, userpic, phone, new Date()];
  let res = await dbCongif.SySqlConnect(sql, sqlArr);
  console.log("插入" + res);
  if (res.affectedRows == 1) {
    // 执行成功获取用户信息
    // 获取用户信息的方法
    let user = await getUser(phone);
    // 创建用户副表
    let userinfo = await createUserInfo(user[0].id);
    if (userinfo.affectedRows == 1) {
      return user
    } else {
      return false
    }
  } else {
    return false
  }
}

// 获取用户信息
let getUser = (username) => {
  let sql = `select * from users where id=? or phone=? or username=?`;
  let sqlArr = [username, username, username];
  return dbCongif.SySqlConnect(sql, sqlArr);
}
// 查看用户详情
let findUserInfo = async (user_id) => {
  let sql = `select * from userinfo where user_id=?`;
  let sqlArr = [user_id];
  let res = await dbCongif.SySqlConnect(sql, sqlArr);
  if (res.length) {
    return true;
  }
  return false;
}
// 修改用户信息详情
let setUserInfo = async (user_id, age, sex, job, path, brithday) => {
  if (await findUserInfo(user_id)) {
    let sql = `update userinfo set age=?,sex=?,job=?,path=?,birthday=? where user_id=?`;
    let sqlArr = [age, sex, job, path, brithday, user_id];
    let res = await dbCongif.SySqlConnect(sql, sqlArr);
    if (res.affectedRows == 1) {
      let user = await getUser(user_id);
      let userinfo = await getUserInfo(user_id);
      user[0].userinfo = userinfo[0];
      return user
    } else {
      return false
    }
  } else {
    let sql = `insert into userinfo (user_id,age,sex,job,path,birthday) value(?,?,?,?,?,?)`;
    let sqlArr = [user_id, age, sex, job, path, birthday];
    let res = await dbCongif.SySqlConnect(sql, sqlArr);
    if (res.affectedRows == 1) {
      let user = await getUser(user_id);
      let userinfo = await getUserInfo(user_id);
      user[0].userinfo = userinfo[0];
      return user
    } else {
      return false
    }
  }
}
// 修改用户名称
let setUserName = async (user_id, username) => {
  let sql = `update users set username=? where id=?`;
  let sqlArr = [username, user_id];
  let res = await dbCongif.SySqlConnect(sql, sqlArr);
  if (res.affectedRows == 1) {
    let user = await getUser(user_id);
    let userinfo = await getUserInfo(user_id);
    user[0].userinfo = userinfo[0];
    return user
  } else {
    return false
  }
}
// 修改资料
editUserInfo = async (req, res) => {
  let {
    user_id,
    username,
    age,
    sex,
    job,
    path,
    birthday
  } = req.query;
  let result = await setUserName(user_id, username);
  if (result) {
    let resl = await setUserInfo(user_id, age, sex, job, path, birthday);
    if (resl.length) {
      res.send({
        'code': 200,
        'data': resl[0]
      })
    } else {
      res.send({
        'code': 400,
        'msg': '修改失败'
      })
    }
  } else {
    res.send({
      'code': 400,
      'msg': '修改失败'
    })
  }
}

// 创建用户副表
let createUserInfo = (user_id) => {
  console.log("创建用户副表");
  let sql = `insert into userinfo(user_id, age, sex, job) values(?, ?, ? ,?)`;
  let sqlArr = [user_id, 20, 2, 1];
  return dbCongif.SySqlConnect(sql, sqlArr);
}

// 获取注册的用户详情
let getUserInfo = (user_id) => {
  let sql = `select * from userinfo where user_id=?`;
  let sqlArr = [user_id];
  return dbCongif.SySqlConnect(sql, sqlArr);
}

// 验证码登录接口
codePhoneLogin = async (req, res) => {
  let {
    phone,
    code
  } = req.query;
  // 判断手机号是否已经发送
  if (sendCodePhone(phone)) {
    let status = findCodePhone(phone, code);
    // 判断手机和验证码是否匹配
    if (status == 'login') {
      // 登录成功
      let user = await phoneLoginBind(phone);
      res.send({
        'code': 200,
        'msg': '登录成功',
        'data': user[0]
      });
    } else {
      res.send({
        'code': 400,
        'msg': '手机和验证码不匹配'
      });
    }
  } else {
    res.send({
      'code': 400,
      'msg': '验证码为发送'
    });
  }
}

// 用户名、手机号登录
login = (req, res) => {
  let username = req.query.phone;
  let password = req.query.password;
  let phone = /^1([38][0-9]|4[579]|5[0-3,5-9]|6[6]|7[0135678]|9[89])\d{8}$/;
  let email = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  if (phone.test(phone)) {
    let sql = `select * from users where phone=? and password=? or username=? and password=?`;
    let sqlArr = [phone, password, phone, password];
    let callBack = async (err, data) => {
      if (err) {
        console.log(err);
        res.send({
          'code': 400,
          'msg': '出错了'
        })
      } else if (data == '') {

        res.send({
          'code': 400,
          'msg': '用户名或者密码出错',
          'data': data
        })
      } else {
        let user_id = data[0].id;
        let result = await getUserInfo(user_id);
        data[0].userinfo = result[0];

        res.send({
          'code': 200,
          'msg': '登录成功',
          'data': data[0]
        })
      }

    }
    dbCongif.sqlConnect(sql, sqlArr, callBack);
  } else if (email.test(username)) {
    let sql = `select * from users where email=? and password=?`;
    let sqlArr = [username, password];
    let callBack = async (err, data) => {
      if (err) {
        console.log(err);
        res.send({
          'code': 400,
          'msg': '出错了'
        })
      } else if (data == '') {

        res.send({
          'code': 400,
          'msg': '邮箱或者密码出错',
          'data': []
        })
      } else {
        let user_id = data[0].id;
        let result = await getUserInfo(user_id);
        data[0].userinfo = result[0];

        res.send({
          'code': 200,
          'msg': '登录成功',
          'data': data[0]
        })
      }
    }
    dbCongif.sqlConnect(sql, sqlArr, callBack);
  } else {
    let sql = `select * from users where username=? and password=?`;
    let sqlArr = [username, password];
    let callBack = async (err, data) => {
      if (err) {
        console.log(err);
        res.send({
          'code': 400,
          'msg': '出错了'
        })
      } else if (data == '') {

        res.send({
          'code': 400,
          'msg': '用户名或者密码出错',
          'data': []
        })
      } else {
        let user_id = data[0].id;
        let result = await getUserInfo(user_id);
        data[0].userinfo = result[0];

        res.send({
          'code': 200,
          'msg': '登录成功',
          'data': data[0]
        })
      }

    }
    dbCongif.sqlConnect(sql, sqlArr, callBack);
  }
}

module.exports = {
  sendCode,
  codePhoneLogin,
  sendCoreCode,
  login,
  editUserInfo
}