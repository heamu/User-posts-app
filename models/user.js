const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/miniproject');
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => console.error('MongoDB connection error:', err));


const userschema = mongoose.Schema({
    name:String,
    username:String,
    email:String,
    password:String,
    age:Number,
    posts:[
        {type:mongoose.Schema.Types.ObjectId,ref:"post"}
    ]
})

module.exports = mongoose.model('user',userschema);