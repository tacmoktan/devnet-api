const express = require('express');
const router = express.Router();

const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
//middleware
const auth = require('../../middleware/auth');
//model
const User = require('../../models/User');

//  @route      GET api/auth
//  @desc       authenticate & get user
//  @access     public

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }

});

//  @route      POST api/auth
//  @desc       authenticate user (login) & get token
//  @access     private

router.post('/',
    [
        check('email', 'Email is Required').isEmail(),
        check('password', 'Password is Required').exists()
    ]
    , async (req, res) => {

        const errors = await validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
            }

            const isMatch = await bcrypt.compare(password, user.password);  //compares user entered plaintext password with hashed password 

            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: "Login failed, invalid credentials" }] });
            }

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
            console.error(err);
            res.status(500).send("Server error");
        }
    }
);



module.exports = router;