const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/register',async(req,res) => {
    try{
        const {name,email,password,role} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'Cet email existe déjà'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        await newUser.save();

        res.status(201).json({message: 'Utilisateur enregistré avec succès'});
    } catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
});

const jwt = require('jsonwebtoken');

router.post('/login',async (req, res) => {
    try{
        const {email, password} = req.body;

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: 'Identifiants invalides'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message: 'Invalid credential'});
        }

        const token = jwt.sign(
            {userId: user._id, role: user.role},
            'your_jwt_secret',
            {expiresIn: '1h'}
        );

        res.json({token, user: {id: user._id, name: user.name, email: user.email, role: user.role} });
    }catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
});

module.exports = router;