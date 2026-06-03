const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  meeting_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'meetings',  // Lowercase to match actual table name
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  assignee: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transcript_timestamp: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  detected_by_ai: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  confidence_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'tasks',  // Lowercase to match convention
  timestamps: true,
  underscored: false
});

module.exports = Task;
