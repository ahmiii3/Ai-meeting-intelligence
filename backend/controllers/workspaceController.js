const Workspace = require('../models/Workspace');
const User = require('../models/User');

/**
 * POST /api/workspaces
 * Create a new workspace
 * Body: { name, description }
 */
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    // Create workspace
    const workspace = await Workspace.create({
      name,
      description,
      owner_id: userId
    });

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: { workspace }
    });
  } catch (error) {
    console.error('Create workspace error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating workspace'
    });
  }
};

/**
 * GET /api/workspaces
 * Get all workspaces for logged-in user (as owner or member)
 */
const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get workspaces where user is owner
    const ownedWorkspaces = await Workspace.findAll({
      where: { owner_id: userId },
      order: [['created_at', 'DESC']]
    });

    // TODO: Later add workspaces where user is a member (Phase 2.1)

    return res.status(200).json({
      success: true,
      data: {
        workspaces: ownedWorkspaces,
        total: ownedWorkspaces.length
      }
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching workspaces'
    });
  }
};

/**
 * GET /api/workspaces/:id
 * Get workspace details by ID
 */
const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workspace = await Workspace.findOne({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access (owner check)
    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace'
      });
    }

    return res.status(200).json({
      success: true,
      data: { workspace }
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching workspace'
    });
  }
};

/**
 * PUT /api/workspaces/:id
 * Update workspace details
 * Body: { name, description, settings }
 */
const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, settings } = req.body;
    const userId = req.user.userId;

    const workspace = await Workspace.findOne({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Only owner can update workspace
    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can update it'
      });
    }

    // Update workspace
    await workspace.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(settings && { settings })
    });

    return res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: { workspace }
    });
  } catch (error) {
    console.error('Update workspace error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating workspace'
    });
  }
};

/**
 * DELETE /api/workspaces/:id
 * Delete workspace (only owner)
 */
const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workspace = await Workspace.findOne({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Only owner can delete workspace
    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can delete it'
      });
    }

    await workspace.destroy();

    return res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting workspace'
    });
  }
};

/**
 * POST /api/workspaces/:id/select
 * Select a workspace for the user
 */
const selectWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const workspace = await Workspace.findOne({
      where: { id }
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access
    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace'
      });
    }

    // Update user's selected workspace
    await User.update(
      { workspace_id: id },
      { where: { id: userId } }
    );

    return res.status(200).json({
      success: true,
      message: 'Workspace selected successfully',
      data: { workspace }
    });
  } catch (error) {
    console.error('Select workspace error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while selecting workspace'
    });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  selectWorkspace
};
