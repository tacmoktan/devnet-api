const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
//models
const User = require('../../models/User');
const Post = require('../../models/Post');

//@route    POST 'api/posts'
//@desc     create a post
//@access   private

router.post('/', [
    auth,
    [
        check('text', 'Text is required').notEmpty()
    ]
], async (req, res) => {

    const errors = await validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ error: errors.array() })

    const user = await User.findById(req.user.id).select('-password');

    const newPost = new Post({
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
    })

    try {
        const post = await newPost.save();
        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
})

//@route    GET api/posts
//@desc     get all posts
//@access   private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });         //sorts by latest post date
        if (!posts)
            return res.status(404).json({ msg: "No posts to show" })

        res.json(posts)

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error")
    }
}
);

//@route    GET api/posts/:id
//@desc     get Post by id
//@access   private

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).sort({ date: -1 });

        if (!post)
            return res.status(404).json({ msg: "Post not found" })

        res.json(post)
    } catch (err) {
        if (err.kind === "ObjectId")
            return res.status(404).json({ msg: "Post not found" })

        console.error(err.message);
        res.status(500).send("Server error");
    }
}
)

//@route    DELETE api/posts/:id
//@desc     delete a post by post id
//@access   private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ msg: "Post Not Found" })

        //check user
        if (post.user.toString() !== req.user.id)
            return res.status(401).json({ msg: "User not authorized" })

        await post.remove();
        res.json({ msg: "post deleted" });
    } catch (err) {
        if (err.kind === "ObjectId")
            return res.status(404).json({ msg: "Post not found" })

        console.error(err.message);
        res.status(500).send("Server error");
    }

})

//@route    PUT api/posts/like/:id
//@desc     like a post
//@access   private 

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ msg: "Post not found" })

        //check if post is already liked
        let postLikeCount = post.likes.filter(like => like.user.toString() === req.user.id).length

        if (postLikeCount > 0)
            return res.status(400).json({ msg: "Post already liked" })

        post.likes.unshift({ user: req.user.id })

        await post.save();
        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
})

//@route    PUT api/posts/unlike/:id
//@desc     unlike a post
//@access   private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ msg: "Post not found" })

        let postUnlikeCount = post.likes.filter(like => like.user.toString() === req.user.id).length

        if (postUnlikeCount === 0)
            return res.status(400).json({ msg: "Post has not been liked yet" })

        //remove index of user who liked a post
        let removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)

        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post)

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

//@route    POST api/posts/comment/:id
//@desc     comment on a post   
//@access   private

router.post('/comment/:id',
    [
        auth,
        check("text", "Text is required").notEmpty()
    ],
    async (req, res) => {
        const errors = await validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() })

        try {
            const user = await User.findById(req.user.id).select("-password");
            const post = await Post.findById(req.params.id);

            if (!post)
                return res.status(404).json({ msg: "Post not found" })

            const newComment = {
                user: user.id,
                text: req.body.text,
                name: user.name,
                avatar: user.avatar
            }

            post.comments.unshift(newComment)

            await post.save();
            res.json(post);


        } catch (err) {
            if (err.kind.includes("ObjectId"))
                return res.status(404).json({ msg: "Post not found" })

            console.error(err.message);
            res.status(500).send("Server error");
        }
    });


//@route    DELETE api/posts/comment/:id/:comment_id
//@desc     delete comment    
//@access   private  
router.delete('/comment/:id/:comment_id',
    auth,
    async (req, res) => {

        try {
            const post = await Post.findById(req.params.id)

            const comment = post.comments.find(comment => comment.id.toString() === req.params.comment_id);

            if (!comment)
                return res.status(404).json({ msg: "Comment not found" })

            //check user
            if (comment.user.toString() !== req.user.id)
                return res.status(401).json({ msg: "User not authorized" })

            const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

            post.comments.splice(removeIndex, 1);

            await post.save();
            console.log("comment deleted");
            res.json(post.comments);

        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }
    }
)


module.exports = router;
