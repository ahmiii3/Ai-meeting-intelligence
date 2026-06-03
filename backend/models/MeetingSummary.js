const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const MeetingSummary = sequelize.define(
  'MeetingSummary',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    meeting_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'meetings',  // Lowercase to match actual table name
        key: 'id'
      }
    },
    executive_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '2-3 sentence high-level summary'
    },
    detailed_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '5-8 bullet points detailed summary'
    },
    key_decisions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Key decisions made in meeting (JSON array format)'
    },
    risks_concerns: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Any risks or concerns mentioned'
    },
    summary_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'detailed',
      validate: {
        isIn: [['executive', 'detailed', 'bullet_points']]
      },
      comment: 'Type of summary generated'
    },
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    generated_by: {
      type: DataTypes.STRING(255),
      defaultValue: 'gpt-4o',
      comment: 'AI model used to generate summary'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'meeting_summaries',  // Lowercase to match convention
    timestamps: true,
    underscored: false
  }
);

module.exports = MeetingSummary;
