const express = require('express');
const router = express.Router();
const request = require('request');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const config = require('config');

// @route     GET api/profile/me
// @desc      Get current users profile
// @access    Private


router.get('/me',auth,async(req,res)=> {
  try {
    const profile = await Profile.findOne({ user:req.user.id}).populate('user',['name','avatar'])
    if(!profile){
      return res.status(400).json({msg:'There is no profile for this user!'})
    }
    // res.send("Hello")
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!')
  }
});

// @route     Post api/profile
// @desc      Create & update user profile
// @access    Private

router.post('/',[auth,[
  check('status','Status is required').not().isEmpty(),
  check('skills','Skills is required').not().isEmpty()
]], async (req,res)=>{
const errors = validationResult(req);
if(!errors.isEmpty()){
  return res.status(400).json({errors:errors.array()})
}
// res.send('hello brother')
const {
  company,
  website,
  location,
  bio,
  status,
  githubusername,
  skills,
  youtube,
  facebook,
  twitter,
  instagram,
  linkedin

}= req.body;
// build profile object
const profileFields = {};
profileFields.user = req.user.id;
if(company) profileFields.company = company;
if(website) profileFields.website = website;
if(location) profileFields.location = location;
if(bio) profileFields.bio = bio;
if(status) profileFields.status = status;
if(githubusername) profileFields.githubusername = githubusername;
if(skills) {
  profileFields.skills = skills.split(',').map(skill =>skill.trim());
}

// Build social object
profileFields.social = {};
if(youtube) profileFields.social.youtube = youtube;
if(facebook) profileFields.social.facebook = facebook;
if(twitter) profileFields.social.twitter = twitter;
if(instagram) profileFields.social.instagram = instagram;
if(linkedin) profileFields.social.linkedin = linkedin;

try {
  let profile = await Profile.findOne({user:req.user.id});
  if(profile){
    // Update
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id},
      { $set: profileFields },
      { new : true}
    )
    return res.json({ profile})
  }
  // Create
  profile = new Profile(profileFields);
  await profile.save();
  res.json(profile)
} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error!')
}
})


// @route     GET api/profile
// @desc      get all profiles
// @access    public

router.get('/',async(req,res)=>{

  try {
    const profiles = await Profile.find().populate('user',['name','avatar']);
   res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }

})

// @route     GET api/profile/user/:user_id
// @desc      Get signle profile by user id
// @access    public

router.get('/user/:user_id',async(req,res)=>{

  try {
    const profile = await Profile.findOne({user : req.params.user_id}).populate('user',['name','avatar']);
    if(!profile){
      res.status(400).json({msg:'Profile not found!'});
    }
   res.json(profile);
  } catch (err) {
    console.error(err.message);
    if(err.kind == 'ObjectId'){
      res.status(400).json({msg:'Profile not found!'});
    }
    res.status(500).send('Server Error!');
  }

})

// @route     Delete api/profile
// @desc      Delet profile and user
// @access    Private

router.delete('/',auth,async(req,res)=>{

  try {
    // @todo -- Delete Posts

    // Delete profile
    await Profile.findOneAndDelete({user: req.user.id});
    // Delete user
    await User.findOneAndDelete({_id: req.user.id});
   res.json({msg:'User deleted!'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }

})


// @route     Put api/profile/experience
// @desc      Add profile experience
// @access    Private

router.put('/experience',[ auth,[
  check('title','Title is required').not().isEmpty(),
  check('company','Company is required').not().isEmpty(),
  check('from','From date is required').not().isEmpty()
]],
async(req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
   return res.status(400).json({ errors: errors.array()})
  }

  const {
          title,
          company,
          location,
          from,
          to,
          current,
          description
  } = req.body;

  // creating new experience object
  const newExp ={

        title,
        company,
        location,
        from,
        to,
        current,
        description
  }
  
try {
  const profile = await Profile.findOne({user:req.user.id})
  profile.experience.unshift(newExp);
  await profile.save();
  res.json(profile);
  
} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error!');
}
}
)

// @route     Delete api/profile/experience/:exp_id
// @desc      remove experience
// @access    Private

router.delete('/experience/:exp_id',auth, async(req,res)=>{
  try {
    const profile = await Profile.findOne({ user: req.user.id});
  // get remove experience index
  const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
   profile.experience.splice(removeIndex,1);
   await profile.save();
   res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
})


// @route     Put api/profile/education
// @desc      Add profile education
// @access    Private

router.put('/education',[auth,[
  check('school','School is required').not().isEmpty(),
  check('degree','Degree is required').not().isEmpty(),
  check('fieldofstudy','Field of study is required').not().isEmpty(),
  check('from','From Date is required').not().isEmpty()
]],
async (req,res)=>{
const errors = validationResult(req);
if(!errors.isEmpty()){
  return res.status(400).json({ errors:errors.array()});
}
const {
  school,
  degree,
  fieldofstudy,
  from,
  to,
  current,
  description
} = req.body;

const newEduction = {
  school,
  degree,
  fieldofstudy,
  from,
  to,
  current,
  description
}
try {
  const profile = await Profile.findOne({ user: req.user.id});
   profile.education.unshift(newEduction);
  await profile.save();
  res.json(profile);
  
} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error!')
}

}
)

// @route     Delete api/profile/education/:edu_id
// @desc      delete education
// @access    Private

router.delete('/education/:edu_id',auth, async(req,res)=>{
  try {
    const profile = await Profile.findOne({user:req.user.id});
    // get removing index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
    await profile.education.splice(removeIndex,1);
    profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})


// @route     Get api/profile/github/:username
// @desc      Get users github repos
// @access    Public

router.get('/github/:username',async (req,res)=>{
try {
  const options ={
    uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&
  sort=created&direction=desc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
  method:'Get',
  headers: { 'user-agent':'node.js'}
  } 
  request(options,(error,response,body)=>{
    if(error){
      console.error(error);
    }
    if(res.statusCode != 200){
      res.status(404).json({msg:'No github profile found!'});
    }
    res.json(JSON.parse(body));
  })

} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error');
}
})

module.exports = router;