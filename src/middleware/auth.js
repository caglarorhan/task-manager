const jwt = require('jsonwebtoken')
const User = require('../models/user');

const auth = async (req, res, next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ','');
        //res.send(process.env.JWT_SECRETKEY);
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        //res.send(decoded);
        //console.log(decoded);
        const user = await User.findOne({_id: decoded._id, 'tokens.token':token});
        if(!user){
            throw new Error('Can not login!');
        }

        req.token = token;
        req.user = user;
        next();
    }catch(e){
        res.status(401).send({error:'Please authenticate!'+e});
    }
};

module.exports = auth;
