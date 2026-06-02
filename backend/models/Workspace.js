const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Workspace name cannot be empty' },
      len: { args: [2, 100], msg: 'Workspace name must be between 2 and 100 characters' }
    }
  },

  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },

  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'workspaces',
  timestamps: true,
  underscored: true
});

module.exports = Workspace;
