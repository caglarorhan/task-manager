const express = require('express');
const User = require('../models/user');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const router = new express.Router();
const multer = require('multer');
const email = require('../email/email')


router.post('/users', async (req,res)=>{
    const user = new User(req.body);

    try{
        await user.save();
        const token = await user.generateAuthToken();
        email(user.email, 'Test',`<b>${user.name}</b> merhaba, uyeliginizi aktive etmek icin lutfen <a href="test.html">bu linke tiklayiniz</a>.`).catch(console.error);

        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e.message)
    }
});



router.post('/users/login', async (req,res)=>{
    try{
        console.log(req.body);
        const user = await User.findByCredentials(req.body.email, req.body.password);
        //console.log(user);
        const token = await user.generateAuthToken();
        console.log('Simdi token gonderiliyor')
        res.send({user, token});
    }catch(e){
        res.status(400).send();
    }
});



router.post('/users/logout', auth, async (req, res)=>{
        try{
            req.user.tokens = req.user.tokens.filter((token)=>{
                return token.token !== req.token
            })
            await req.user.save();
            res.send();
        }catch(e){
            res.status(500).send();
        }
});


router.post('/users/logoutAll', auth, async (req,res)=>{
        try{
            req.user.tokens=[];
            await req.user.save();
            res.status(200).send({message: "Successfully logged out all!"});
        }catch(e){
            res.status(500).send();
        }
});



router.get('/users/me', auth,  async (req, res)=>{
    res.send(req.user);
});

router.get('/users/:id', async (req, res)=>{
    const _id = req.params.id;
    try{
        const user = await User.findById(_id);
        if(!user){
            return res.status(404).send('User could not found!')
        }
        res.send(user);
    }catch(error){
        res.status(500).send(error)
    }
});



router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name','email','age','password'];
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update));


    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'});
    }

    try{
        const user = req.user;
        updates.forEach((update)=>user[update] = req.body[update]);

        await user.save();

        if(!user){
            return res.status(404).send('User could not found!')
        }
        res.send(user);
    }catch(error){
        res.status(500).send(error)
    }
});

router.delete('/users/me',auth,  async (req, res)=>{
    try{
        await req.user.remove();
        email(user.email, 'Test',`<b>${user.name}</b> merhaba, isteginiz userine uyeliginiz silinmistir.`).catch(console.error);
        res.send(req.user);
    }catch(error){
        res.status(500).send(error)
    }
});

//Eger multer fonksiyonuna giden nesnede dest isimlibir proerty yoksa upload middleware i upload edilen dosyayi bir sonraki middleware e verir
//varsa hedef klasor olarak oraya kaydeder
//dest: 'images/avatars',
const upload = multer({

    limits:{
        fileSize: 10000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)){
            return cb(new Error('Please upload one of the correct file types (jpeg, jpg, png)'));
        }
        cb(undefined, true);
    }
});


router.post(
    '/users/me/avatar',
    auth,
    upload.single('avatar'),
    async (req, res)=>{
        const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer();
                req.user.avatar = buffer;
        await req.user.save();
                        res.status(200).send({message: "Avatar picture uploaded successfully!"})
                        },
    (error, req, res, next)=>{
                        res.status(400).send({error: error.message})
                            }
    );

router.delete(
    '/users/me/avatar',
    auth,
    async (req, res)=>{
        req.user.avatar = undefined;
        await req.user.save();
                        res.status(200).send({message: "Avatar picture deleted!"})
                        }
    );


router.get('/users/:id/avatar', async (req, res)=>{
    try{
        const user = await User.findById(req.params.id);
        if(!user){
            throw new Error('User could not found!');
        }

        res.set('Content-Type','image/png');
        res.send(user.avatar);


    }catch(e){
        res.status(400).send({error:e.message});
    }
});

module.exports = router;
