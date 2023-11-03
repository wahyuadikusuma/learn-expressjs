import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async(req,res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'name', 'email']
        });
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

const isEmailUnique = async (email) => {
    const existingUser = await Users.findOne({ where: { email }});
    return !existingUser; // Return true if the email is unique, false if it already exists
  };

export const Register = async(req, res) => {
    const { name, email, password, confPassword } = req.body;

    if (!name || !email || !password || !confPassword) {
        return res.status(400).json({
            msg: "Data tidak lengkap!"
        })
    }

    // Check if the email is unique
    const isUnique = await isEmailUnique(email);

    if (!isUnique) {
        return res.status(400).json({
            msg: "Email sudah digunakan!"
        });
    }

    if(password !== confPassword) {
        return res.status(400).json({
            msg: "Password dan Confirm Password tidak cocok!"
        });
    }
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword,
        })
        res.status(200).json({msg: "Register Berhasil!"});
    } catch (error) {
        console.log(error);
    }
}

export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg:"Authentication Failed!"});
        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const accessToken = jwt.sign({userId,name,email}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '60s'
        });
        const refreshToken = jwt.sign({userId,name,email}, process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '1d'
        });
        await Users.update({refresh_token:refreshToken},{
            where:{
                id: userId
            }
        });
        res.cookie('refreshToken', refreshToken,{
            httpOnly:true,
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ accessToken });
    } catch (error) {
        res.status(404).json({msg:"Authentication Failed!"});
    }
}

export const Logout = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.sendStatus(204);
        const user = await Users.findAll({
            where:{
                refresh_token: refreshToken
            }
        });
        if(!user[0]) return res.sendStatus(204);
        const userId = user[0].id;
        await Users.update({refresh_token: null},{
            where:{
                id:userId
            }
        });
        res.clearCookie('refreshToken');
        return res.sendStatus(200);
    } catch (err){
        console.log(err);
    }
}
