const mongoose = require('mongoose');
const { Schema } = mongoose;
//model
const User = require('./User');


const profileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'                 //collection
    },
    bio: {
        type: String
    },
    address: {
        type: String
    },
    company: {
        type: String
    },
    website: {
        type: String
    },
    github: {
        type: String
    },
    status: {
        type: String,
        required: true
    },
    skills: {
        type: [String],
        required: true
    },
    experience: [
        {
            title: {
                type: String,
                required: true
            },
            company: {
                type: String,
                required: true
            },
            from: {
                type: Date,
                required: true
            },
            to: {
                type: Date
            },
            current: {
                type: Boolean,
                default: false
            }

        }
    ],
    education: [
        {
            school: {
                type: String,
                required: true
            },
            degree: {
                type: String,
                required: true
            },
            from: {
                type: Date,
                required: true
            },
            to: {
                type: Date
            },
            current: {
                type: Boolean,
                default: false
            }
        }
    ],
    social: {
        facebook: {
            type: String
        },
        linkedin: {
            type: String
        },
        youtube: {
            type: String
        }
    }
})


module.exports = Profile = mongoose.model('profile', profileSchema);