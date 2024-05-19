const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode');
const jwt = require('jsonwebtoken')

const getAllUsers = catchError(async(req, res) => {

    const users = await User.findAll({

    });
    return res.json(users);
});

const createUser = catchError(async(req, res) => {
    const {email, password, firstName, lastName, country, image, frontBaseUrl} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        country,
        image,
    });
    const code = require('crypto').randomBytes(32).toString('hex')
    const link = `${frontBaseUrl}/${code}`

    await EmailCode.create({
        code: code,
        userId: user.id,
    });

	await sendEmail({
		to: email,
		subject: "Creación de usuario",
		html: `
            <h1>Hola! ${firstName} ${lastName}</h1>
            <p>Tu usuario a sido creado exitosamente</p>
            <p>Haga click en este enlace para verificar su correo: </p>
            <a href=${link}>${link}</a>
        `
		});
    return res.status(201).json(user);
});

const getOneUser = catchError(async(req, res) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if(!user) return res.sendStatus(404);
    return res.json(user);
});

const removeUser = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const updateUser = catchError(async(req, res) => {
    const {email, firstName, lastName, country, image} = req.body;
    const { id } = req.params;
    const user = await User.update({
        email, firstName, lastName, country, image
    },
        { where: {id}, returning: true }
    );
    if(user[0] === 0) return res.sendStatus(404);
    return res.json(user[1][0]);
});

const veryfyCode = catchError(async(req, res) => {
    const { code } = req.params;
    const emailCode = await EmailCode.findOne({where: { code: code }});
    if (!emailCode) return res.status(401).json({ message: "Invalid Code"}); 
    
    const user = await User.findByPk(emailCode.userId);
    user.isVerified = true
    await user.save();

    await emailCode.destroy();
    
    return res.json(user);
});

const login = catchError(async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({ where: {email:email} });
    if(!user) return res.status(401).json({message: 'Invalid Credentials'});
    if(!user.isVerified) return res.status(401).json({message: 'User is not verify'});
    const isValid = await bcrypt.compare(password, user.password);
    if(!isValid) return res.status(401).json({message: 'Invalid Creentials'});
     
    const token = jwt.sign(
        { user },
        process.env.TOKEN_SECRET,
        { expiresIn: '1d' },
    );
    return res.json({user, token});
});

const getLogged = catchError(async(req, res) => {
    return res.json(req.user);
});


module.exports = {
    getAllUsers,
    createUser,
    getOneUser,
    removeUser,
    updateUser,
    veryfyCode,
    login,
    getLogged,
}