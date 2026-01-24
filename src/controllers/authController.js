const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');

const authController = {
    login: async (request, response) => {
        const { email, password } = request.body;

        if (!email || !password) {
            return response.status(400).json({
                message: 'Email and Password are required'
            });
        }

        const user = await userDao.findByEmail(email);

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (user && isPasswordMatched) {
            return response.status(200).json({
                message: 'User authenticated',
                user: user
            });
        } else {
            return response.status(400).json({
                message: 'Invalid email or password'
            });
        }
    },

    register: async (request, response) => {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: 'Name, Email, Password are required'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        userDao.create({
            name: name,
            email: email,
            password: hashedPassword
        })
            .then(u => {
                return response.status(200).json({
                    message: 'User registered',
                    user: { id: u._id }
                });
            })
            .catch(error => {
                if (error.code === 'USER_EXIST') {
                    console.log(error);
                    return response.status(400).json({
                        message: 'User with the email already exist'
                    });
                } else {
                    return response.status(500).json({
                        message: "Internal server error"
                    });
                }
            });
    },
};

module.exports = authController;