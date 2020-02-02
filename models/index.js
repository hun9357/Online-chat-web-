const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'users.sqlite'
});

const User = sequelize.import("./information.js");

module.exports={
    User
};