const User = require("../models/user");
const router= require("express").Router();
const bcrypt = require("bcrypt");

//update user
router.put("/:id",async(req,res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        if(req.body.password){
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password= await bcrypt.hash(req.body.password,salt);
            } catch(err){
                return res.status(500).json(err);
            }
        }
        try{
            const user = await User.findByIdAndUpdate(req.params.id,{$set: req.body
            });//set all inputs inside this body
            res.status(200).json("Account has been updated")
        }catch(err){
            return res.status(500).json(err);
        }

    } //params for id in the parameter
    else{
        return res.status(403).json("You can update only your account");
    }
});//updating process//will allow us to choose any id


//delete user
router.delete("/:id",async(req,res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        try{
            const user = await User.findByIdAndDelete(req.params.id);//set all inputs inside this body
            res.status(200).json("Account has been deleted successfully")
        }catch(err){
            return res.status(500).json(err);
        }

    } //params for id in the parameter
    else{
        return res.status(403).json("You can delete only your account");
    }
});


//get a user

// router.get("/:id",async (req,res)=>{
//     try{
//         const user = await User.findById(req.params.id);
//         const {password,updatedAt, ...other}=user._doc;//hide sensitive data when get req is done
//         res.status(200).json(other);//send the other details 

//     }catch(err){
//         res.status(500).json(err)
//     }
// })

router.get("/",async (req,res)=>{
    const userId = req.query.userId;
    const username = req.query.username;
    try{
        const user = userId ? await User.findById(userId) : await User.findOne({username:username}) ;
        const {password,updatedAt, ...other}=user._doc;//hide sensitive data when get req is done
        res.status(200).json(other);//send the other details 

    }catch(err){
        res.status(500).json(err)
    }
})


//get friends
router.get("/friends/:userId", async (req,res)=>{
    try{
        const user = await User.findById(req.params.userId);
        const friends = await Promise.all(
          user.followings.map(friendId =>{
            return User.findById(friendId)
          })     
        )
        let friendList = [];
        friends.map(friend=>{
            const {_id,username,profilePicture} = friend; //similar to const username = friend.username//destructuring
            friendList.push({_id,username,profilePicture});
        });

        res.status(200).json(friendList);

    }
    catch(err){
        res.status(500).json(err)
    }
});


//follow user
router.put("/:id/follow",async (req,res)=>{
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(!user.followers.includes(req.body.userId)){
                await user.updateOne({$push:{followers: req.body.userId}});
                await currentUser.updateOne({$push:{followings: req.params.id}});
                res.status(200).json("User Followed Successfully!!");
            }else{
                res.status(403).json("You already Follow this user");
            }


        } catch(err){
            res.status(500).json(err)
        }

    } else{
        res.status(403).json("You can't follow yourself")
    }
});

//unfollow user

router.put("/:id/unfollow",async (req,res)=>{
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(user.followers.includes(req.body.userId)){
                await user.updateOne({$pull:{followers: req.body.userId}});
                await currentUser.updateOne({$pull:{followings: req.params.id}});
                res.status(200).json("User Unfollowed Successfully!!");
            }else{
                res.status(403).json("you dont follow this user");
            }


        } catch(err){
            res.status(500).json(err)
        }

    } else{
        res.status(403).json("You can't unfollow yourself")
    }
})

//Search-User
router.get("/search", async (req, res) => {
    const { searchQuery } = req.query;
    try {
      const users = await User.find({
        username: { $regex: searchQuery, $options: "i" }, // Case-insensitive search
      });
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  //editDetails
  router.post("/:id/edit", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user._id.toString() === req.body.userId) {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        city: req.body.city,
                        from: req.body.country,
                        relationship: req.body.relationship
                    }
                },
                { new: true } // returns the updated document
            );
            return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
        } else {
            return res.status(403).json({ message: 'Unauthorized action' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user', error });
    }
});

//profile pic update
router.post("/:id/profile/picture", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user._id.toString() === req.body.userId) {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        profilePicture: req.body.fileName
                    }
                },
                { new: true } // returns the updated document
            );
            return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
        } else {
            return res.status(403).json({ message: 'Unauthorized action' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user', error });
    }
});

//get all users
router.get("/all", async(req,res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



// router.get("/",(req,res)=>{
//     res.send("hey its user route");
// })

module.exports=router;