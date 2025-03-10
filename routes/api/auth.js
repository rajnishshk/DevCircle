const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// @route     GET api/auth
// @desc      Test route
// @access    Public


router.get('/',auth, async(req,res)=>{
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user)
  } catch (err) {
    res.status(500).send('Server Error!');
  }
});




// @route     Post api/auth
// @desc      authenticate user & get token
// @access    Public


router.post('/',[
  check('email','Please include a valid email').isEmail(),
  check('password','Password is required!').exists()
],
async(req,res)=> {
  // console.log(req.body);
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array()})
  }

  const {email,password} = req.body;
  try{
  // see if user not exist
  let user = await User.findOne({ email });
  if(!user){
    res.status(400).json({ errors :[{msg:'Invalid Credentials'}]})
  }
  
const isMatch = await bcrypt.compare(password,user.password);
if(!isMatch){
  res.status(400).json({ errors :[{msg:'Invalid Credentials'}]})
}

  // return jsonwebtoken
  const payload ={
    user:{
      id: user.id
    }
  }
  jwt.sign(
    payload,
    config.get('jwtSecret'),
    { expiresIn: 360000},
    (err,token)=>{
    if(err) throw err;
  res.json({ token })
})
  // res.send('User registered !');


}catch(err){
console.error(err.message);
res.status(500).send('server Error')
}})


module.exports = router;