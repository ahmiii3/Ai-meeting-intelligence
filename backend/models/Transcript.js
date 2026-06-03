const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transcript = sequelize.define('Transcript', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  meeting_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'meetings',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  chunk_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  speaker: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'transcripts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['meeting_id', 'chunk_index'] },
    { fields: ['meeting_id', 'created_at'] }
  ]
});

module.exports = Transcript;
