const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
//model
const User = require('../../models/User.js');

//  @route      POST api/user
//  @desc       register a user
//  @access     public

router.post('/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Email is required').isEmail(),
        check('password', 'Password must contain min 5 characters').isLength({ min: 5 })
    ],
    async (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            //check if user exists
            user && res.status(400).json({ errors: [{ msg: "User already exists" }] });

            //avatar
            let avatar = gravatar.url(email, {
                s: '400',            //size
                r: 'pg',             //ratings
                d: 'mm'              //default
            });

            user = new User({
                name, email, password, avatar
            })

            //encrypt password
            let saltRounds = 10;
            const salt = await bcrypt.genSalt(saltRounds);
            user.password = await bcrypt.hash(password, salt);

            await user.save();
            //res.send('user registered');

            //return JWT
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    }
);

//@route        GET api/user/all_users
//@desc         get all users
//@access       public

router.get('/all_users', async (req, res) => {
    try {

        const users = await User.find();

        if (!users)
            return res.json({ errors: [{ msg: "no users found" }] });

        res.json(users);
    } catch (errors) {
        console.log(errors.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;