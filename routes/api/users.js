const express = require('express');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('config');

// @route     Post api/user
// @desc      Register user
// @access    Public


router.post('/',[
  check('name','Name is required!').not().isEmpty(),
  check('email','Please include a valid email').isEmail(),
  check('password','Please enter a password with 6 or more character').isLength({ min: 6})
],
async(req,res)=> {
  // console.log(req.body);
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array()})
  }

  const {name,email,password} = req.body;
  try{
  // see if user exist
  let user = await User.findOne({ email });
  if(user){
    res.status(400).json({ errors :[{msg:'user already exist!'}]})
  }
  // get use gravatar
  const avatar = gravatar.url(email,{
    s:200,
    r:'pg',
    d:'mm'
  })

  user = new User({
    name,
    email,
    avatar,
    password
  })
  // encrypt password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password,salt);
  await user.save()
  // return jsonwebtoken
  const payload ={
    user:{
      id: user.id
    }
  }
  jwt.sign(payload,config.get('jwtSecret'),
{ expiresIn: 360000},(err,token)=>{
  if(err) throw err;
  res.json({ token })
})
  // res.send('User registered !');


}catch(err){
console.error(err.message);
res.status(500).send('server error');
}
}
)
module.exports = router;