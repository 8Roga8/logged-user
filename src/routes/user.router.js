const { getAllUsers, createUser, getOneUser, removeUser, updateUser, veryfyCode, login, getLogged} = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWY');

const userRouter = express.Router();

userRouter.route('/users')
    .get(verifyJWT ,getAllUsers)
    .post(createUser);

userRouter.route('/users/login')
    .post(login);

userRouter.route('/users/me')
    .get(verifyJWT ,getLogged);

userRouter.route('/users/:id')
    .get(verifyJWT ,getOneUser)
    .delete(verifyJWT ,removeUser)
    .put(verifyJWT ,updateUser);

userRouter.route('/users/verify/:code')
    .get(veryfyCode);


module.exports = userRouter;