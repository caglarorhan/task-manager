const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();


router.post('/tasks', auth, async (req,res)=>{

    const task= new Task({
       ...req.body,
       owner: req.user._id
    });

    try{
        await task.save();
        res.status(201).send(task);
    }catch(error){
        res.status(400).send('Not found!'+ error.message);
    }

});
//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks',auth, async (req,res)=>{
const match = {};
const sort ={};

if(req.query.completed){
    match.completed = req.query.completed==='true';
}

if(req.query.sortBy){
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1]==='desc'?-1:1;
}

    try {
        //await req.user.populate('userTasks').execPopulate()
        await req.user.populate({
            path: 'userTasks',
            match,
            options: {
                limit:parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(req.user.userTasks);

    }catch (error) {
        res.status(500).send('An error occured:'+error);
    }
});

router.get('/tasks/:id',auth, async (req,res)=>{
    const _id = req.params.id;
    try {
        const tasks = await Task.findOne({_id, owner: req.user._id});
        if(!tasks){
            res.status(404).send('No tasks found!')
        }
        res.status(200).send(tasks);

    }catch (error) {
        res.status(500).send('An error occured:'+error);
    }
});

router.delete('/tasks/:id',auth, async (req,res)=>{
    const _id = req.params.id;
    try {
        const tasks = await Task.findOneAndDelete({_id, owner: req.user._id})
        if(!tasks){
            res.status(404).send('No tasks found!')
        }

        res.status(200).send(tasks);

    }catch (error) {
        res.status(500).send('An error occured:'+error);
    }
});

router.patch('/tasks/:id', auth, async (req,res)=>{
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'ownersEmail'];
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(404).send('This updates does not allowed!')
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});

        if(!task){
            res.status(404).send('No tasks found!')
        }
        updates.forEach((update)=>task[update] = req.body[update]);
        await task.save();
        res.status(200).send(task);

    }catch (error) {
        res.status(500).send('An error occured:'+error);
    }
});

module.exports = router;
