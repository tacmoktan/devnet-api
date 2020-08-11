const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const config = require('config');
const axios = require('axios');
//model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    GET api/profile/me
//@desc     Get current user's profile
//@access   private

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            'user',
            ['name', 'avatar']
        );

        if (!profile) {
            return res.status(400).json({ errors: [{ msg: 'There is no profile of this user' }] });
        }

        res.json(profile);

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ msg: "Server Error" })
    }

});

//@route    POST api/profile
//@desc     create or update profile
//@access   private
router.post('/',
    [
        auth,
        [
            check('status', 'Status is required').notEmpty(),
            check('skills', 'Skills is required').notEmpty()
        ]
    ], async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() })

        const { company, website, github, status, skills, facebook, linkedin, youtube } = req.body;

        //build profileFields object
        let profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (website) profileFields.github = github;
        if (status) profileFields.status = status;

        //build profileFields skills
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        //build profileFields socials
        profileFields.social = {}
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (youtube) profileFields.social.youtube = youtube;

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            //update profile
            if (profile) {
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
                return res.json(profile);
            }

            //create profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    }
);

//@route        GET api/profile/all
//@desc         get all profiles
//@access       public

router.get('/all', async (req, res) => {
    try {
        let profiles = await Profile.find().populate('user', ['name, avatar']);

        if (!profiles)
            return res.status(400).json({ errors: [{ msg: "No profiles" }] })

        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
});


//@route        GET api/profile/user/:user_id
//@desc         get user's profile by id
//@access       public
router.get('/user/:user_id', async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile)
            return res.status(400).json({ errors: [{ msg: "No profile found" }] })

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
})


//@route        DELETE api/profile
//@desc         delete profile, user & posts
//@access       private
router.delete('/', auth, async (req, res) => {
    try {
        //remove users post
        await Post.deleteMany({ user: req.user.id });

        //remove profile
        await Profile.findOneAndDelete({ user: req.user.id });

        //remove user
        await User.findOneAndDelete({ _id: req.user.id });

        res.json({ msg: "User deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

//@route        PUT api/profile/experience
//@desc         add a experience
//@access       private

router.put('/experience',
    [
        auth,
        [
            check('title', 'Title is required').notEmpty(),
            check('company', 'Company is required').notEmpty(),
            check('from', 'From Date is required').notEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { title, company, from, to, current } = req.body;

        let newExp = { title, company, from, to, current };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);         //inserts newExp at the start of array
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("server error");
        }
    }
)

//@route        DEL api/profile/experience/:exp_id
//@desc         delete experience from profile using exp_id
//@access       private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);
        await profile.save()
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
});

//@route        PUT api/profile/education
//@desc         add education in profile
//@access       private

router.put('/education',
    [
        auth,
        [
            check('school', 'School is required').notEmpty(),
            check('degree', 'Degree is required').notEmpty(),
            check('from', 'From Date is required').notEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { school, degree, from, to, current } = req.body;

        let newEdu = { school, degree, from, to, current };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("server error");
        }
    }
)

//@route        DEL api/profile/education/:edu_id
//@desc         delete education by id in profile
//@access       private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        let removeIndex = profile.education.map(edu => edu.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
});

/* Oauth  process*/

//@route        GET api/profile/github/:username
//@desc         get github repo by username  
//@access       public

router.get('/github/:username', (req, res) => {

    try {
        // const redirectURI = 'http://localhost:5000/api/profile/user/signin/callback';
        //https://github.com/login/oauth/authorize?client_id=a6d6cbf89be9a948e956&redirect_uri=http://localhost:5000/api/profile/user/signin/callback
        axios.get(`https://github.com/login/oauth/authorize?client_id=${config.get('githubClientId')}`)
            .then(response => {
                if (!response)
                    return res.status(404).json({ errors: [{ msg: "Github profile not found" }] });

                console.log(response.config.url);
                /* console.log({code}); */
                res.send("response found")
            }).catch(error => console.error(error))

    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
})

router.get('/user/signin/callback', (req, res) => {
    try {
        const { code } = req.query;
        console.log('code:' + code);
        let accessToken = "";

        if (!code)
            return res.status(400).json({ errors: [{ msg: "Code not found" }] })

        axios({
            method: 'post',
            url: `https://github.com/login/oauth/access_token?code=${code}&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            headers: {
                "Accept": "application/json"
            }
        }).then(response => {
            if (!response)
                return res.send("access token not found")

            console.log(response.data);
            console.log(response.data.access_token);
            res.send(response.data);

            accessToken = response.data.access_token;
            //request using access token
            axios({
                method: 'get',
                url: `https://api.github.com/user`,
                headers: {
                    'Authorization': `token ${accessToken}`
                }
            }).then(response => {
                //gives github data
                console.log(response.data);

            }).catch(error => console.error(error));

        }).catch(error => console.error(error))

    } catch (err) {
        console.error(err.message);
        res.status(500).send("server error");
    }
});
module.exports = router;