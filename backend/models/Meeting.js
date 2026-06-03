const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  workspace_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'workspaces',
      key: 'id'
    }
  },

  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Meeting title cannot be empty' },
      len: { args: [2, 200], msg: 'Title must be between 2 and 200 characters' }
    }
  },

  platform: {
    type: DataTypes.STRING(20),
    defaultValue: 'custom',
    validate: {
      isIn: {
        args: [['zoom', 'meet', 'teams', 'custom']],
        msg: 'Platform must be zoom, meet, teams, or custom'
      }
    }
  },

  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'completed']],
        msg: 'Status must be active or completed'
      }
    }
  },

  start_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },

  duration: {
    type: DataTypes.INTEGER, // Duration in seconds
    defaultValue: 0
  },

  meeting_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },

  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'workspace_id', 'created_at'] },
    { fields: ['status', 'created_at'] },
    { fields: ['workspace_id'] }
  ]
});

module.exports = Meeting;
