const mongoose = require('mongoose');
const validator = require('validator');

const taskSchema = new mongoose.Schema({
    description: {
        type:String,
        required: true,
        trim: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    completed: {
        type:Boolean,
        default: false,
        required: false
    },
    complete_date: {type: Date,
        default: () => new Date(+new Date() + 7*24*60*60*1000),
        required:false
    }

},{
    timestamps:true
});

taskSchema.pre('save', async (next)=>{

    const task = this;

    next();
});

const Task = new mongoose.model('Task',taskSchema);

module.exports = Task;
