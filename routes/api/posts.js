const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');


// @route     Post api/posts
// @desc      Create a post
// @access    private


router.post('/',[auth,[
  check('text','Text is required').not().isEmpty(),

]],async(req,res)=> {

const errors = validationResult(req);
if(!errors.isEmpty()){
  return res.status(400).json({ errors : errors.array()});
}

try {
  
  const user = await User.findById(req.user.id).select('-password');
  const newPost = new Post(
    {
      text: req.body.text,
      name:user.name,
      avatar:user.avatar,
      user:req.user.id
    }
  )
  const post = await newPost.save();
  res.json(post);

} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error!');
}


});

// @route     Get api/posts
// @desc      Get all posts
// @access    private
router.get('/',auth,async(req,res)=>{
  try {
    const posts = await Post.find().sort({date:-1})
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error')
  }
})

// @route     Get api/posts/:id
// @desc      Get post by id
// @access    private
router.get('/:id',auth,async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      res.status(404).json({msg: 'No posts found!'});
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if(err.kind == 'ObjectId'){
      res.status(404).json({msg:'No posts found!'});
    }
    res.status(500).send('Server Error')
  }
})


// @route     delete api/posts/:id
// @desc      Delete a post
// @access    private

router.delete('/:id',auth, async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      res.status(404).json({msg:'No post found!'});
    }
    // check user
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({msg :'User not authorized'});
    }
    await post.deleteOne();
    res.json({msg :'Post Deleted!'})

  } catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjectId'){
      res.status(404).json({msg:'No post found'})
    }
    res.status(500).send('Server Error');
  }
})

// @route     put api/posts/likes/:id
// @desc      Like a post
// @access    private

router.put('/like/:id',auth,async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);

    // Check if post is already being liked
    if(post.likes.filter(like=> like.user.toString() === req.params.id).length > 0){
     return res.status(400).json({msg:'Post already liked!'});
    }
    post.likes.unshift({ user: req.params.id})
    await post.save();
    res.json(post.likes)
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
})

// @route     put api/posts/unlikes/:id
// @desc      Unlike a post
// @access    private
router.put('/unlike/:id',auth,async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);

  // check if post is not liked yet
  if(post.likes.filter(like => like.user.toString()=== req.params.id).length === 0){
    return res.status(400).json({msg :' Post is not liked yet'});
  }
  // get removing index
  const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
  post.likes.splice(removeIndex,1);
  post.save();
  res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjectId'){
      res.status(404).json({msg:'No post found'})
    }
    res.status(500).send('Server Error')
  }

})


// @route     Post api/posts/comment/:id
// @desc      Comment on a post
// @access    private

router.post('/comment/:id',[auth,[
  check('text','Text is required!').not().isEmpty()
]],async(req,res)=>{

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.status(400).json({ errors: errors.array()})
  }
  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);
    const newComment = {
      text:req.body.text,
      name:user.name,
      avatar:user.avatar,
      user:req.user.id
    }
    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments)

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

// @route     Delete api/posts/comment/:id/:comment_id
// @desc      Delete a comment
// @access    private

router.delete('/comment/:id/:comment_id',auth, async( req,res)=>{
  try {
    
    const post = await Post.findById(req.params.id);
    // pull out the comment
    const comment = post.comments.find(comment=> comment.id === req.params.comment_id);
    // make sure that commet exist
    if(!comment){
      res.status(404).json({msg :'Comment does not exist'});
    }
    // check user
    if(comment.user.toString() !== req.user.id){
      res.status(401).json({msg: 'User not authorized'});
    }
    //  get removing index
    const removeIndex= post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
    post.comments.splice(removeIndex,1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Errror')    
  }
})
module.exports = router;