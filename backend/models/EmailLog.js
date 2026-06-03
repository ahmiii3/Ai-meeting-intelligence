const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const EmailLog = sequelize.define(
  'EmailLog',
  {
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
    recipient: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Email recipient address'
    },
    recipient_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'generic',
      validate: {
        isIn: [['organizer', 'task_owner', 'client', 'stakeholder', 'generic']]
      },
      comment: 'Type of recipient'
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Email subject line'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Email body content (HTML or plain text)'
    },
    email_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'followup',
      validate: {
        isIn: [['followup', 'task_assigned', 'task_reminder', 'decision_confirmation', 'custom']]
      },
      comment: 'Type of email'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'failed', 'draft']]
      },
      comment: 'Email delivery status'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for failure if status = failed'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'email_logs',  // Lowercase to match convention
    timestamps: true,
    underscored: false
  }
);

module.exports = EmailLog;
