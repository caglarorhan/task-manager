const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt =  require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is not valid!');
            }
        },
        min:[6, 'Email must larger than 6 characters']
    },
    age: {
        type: Number,
        required: false
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength:[6, 'Password must larger than 6 characters'],
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password can not include word password');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required:true
        }
    }],
    avatar: Buffer
},{
    timestamps: true
});

userSchema.virtual('userTasks',{
    ref:'Task',
    localField:'_id',
    foreignField: 'owner'
});


userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.SECRETKEY);

    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;

};

userSchema.statics.findByCredentials = async (email, password)=>{
    const user = await User.findOne({email});

    if(!user){
     throw new Error('Unable to login!');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      throw new Error('Unable to login!')
    }
    return user;
};


userSchema.pre('save', async function(next){
    const user = this;
//console.log(user)
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }
//console.log('Save oncesi kontrol yapildi simdi save edilecek')
    next();
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function(next){
    const user =this;
    await Task.deleteMany({owner: user._id})
    next();
});

const User = mongoose.model('User', userSchema);


module.exports = User;
