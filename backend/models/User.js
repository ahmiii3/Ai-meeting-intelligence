const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  workspace_id: {
    type: DataTypes.UUID,
    allowNull: true,
    defaultValue: null
  },

  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Full name cannot be empty' },
      len: { args: [2, 100], msg: 'Full name must be between 2 and 100 characters' }
    }
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'Email already in use' },
    validate: {
      isEmail: { msg: 'Please provide a valid email address' },
      notEmpty: { msg: 'Email cannot be empty' }
    }
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  role: {
    type: DataTypes.ENUM('owner', 'member'),
    allowNull: false,
    defaultValue: 'owner'
  },

  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true   // maps createdAt -> created_at, updatedAt -> updated_at
});

module.exports = User;
