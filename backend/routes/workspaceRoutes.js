const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  selectWorkspace
} = require('../controllers/workspaceController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateWorkspace } = require('../middlewares/validationMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Create workspace
router.post('/', validateWorkspace, createWorkspace);

// Get all user workspaces
router.get('/', getUserWorkspaces);

// Get workspace by ID
router.get('/:id', getWorkspaceById);

// Update workspace
router.put('/:id', validateWorkspace, updateWorkspace);

// Delete workspace
router.delete('/:id', deleteWorkspace);

// Select workspace
router.post('/:id/select', selectWorkspace);

module.exports = router;
