/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('information', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement:  true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'information',
    timestamps: false
  });
};
