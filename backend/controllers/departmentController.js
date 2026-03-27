import mongoose from "mongoose";
import { Faculty, Department } from "../models/index.js";
import {
  normalizeString,
  formatDateTime,
  assertCondition,
  assertFacultyScope,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const addDepartment = async (req, res) => {
  try {
    const { name, code, faculty_id } = req.body;

    assertCondition(name && code && faculty_id, 400, "Name, code and faculty are required");
    ensureValidObjectId(faculty_id, "faculty_id");

    assertFacultyScope(req.user, faculty_id, "You can only add departments to your own faculty");

    const faculty = await Faculty.findById(faculty_id);
    assertCondition(faculty, 400, "Faculty not found");

    const departmentExists = await Department.findOne({
      code: code?.trim?.().toUpperCase?.(),
    });
    assertCondition(!departmentExists, 400, "Department already exists");

    const department = new Department({
      name: normalizeString(name),
      code: code.trim().toUpperCase(),
      faculty_id,
      created_by: req.user.id,
    });

    await department.save();

    await Faculty.findByIdAndUpdate(faculty_id, {
      $addToSet: { departments: department._id },
    });

    res
      .status(201)
      .json({ message: "Department created successfully", department });

  } catch (err) {
    return handleControllerError(res, err, "Server error");
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { name, code, faculty_id } = req.body;

    ensureValidObjectId(req.params.id, "department id");
    if (faculty_id) ensureValidObjectId(faculty_id, "faculty_id");

    const department = await Department.findById(req.params.id);
    assertCondition(department, 404, "Department not found");

    assertFacultyScope(
      req.user,
      department.faculty_id,
      "You can only update departments in your own faculty"
    );

    const oldFacultyId = department.faculty_id.toString();
    const newFacultyId = faculty_id || oldFacultyId;

    if (name) department.name = normalizeString(name);
    if (code) department.code = code.trim().toUpperCase();
    department.faculty_id = newFacultyId;
    department.updated_by = req.user.id;

    await department.save();

    if (faculty_id && faculty_id !== oldFacultyId) {
      await Faculty.findByIdAndUpdate(oldFacultyId, {
        $pull: { departments: department._id },
      });
      await Faculty.findByIdAndUpdate(faculty_id, {
        $addToSet: { departments: department._id },
      });
    }

    res.json({ message: "Department updated successfully", department });

  } catch (err) {
    return handleControllerError(res, err, "Failed to update department");
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    let query = {};

    if (req.query.faculty_id) {
      ensureValidObjectId(req.query.faculty_id, "faculty_id");
      query.faculty_id = req.query.faculty_id;
    } else if (!isSuperAdmin(req.user)) {
      assertCondition(req.user.faculty_id, 403, "Faculty Admin must be assigned to a faculty");
      ensureValidObjectId(req.user.faculty_id, "faculty_id");

      query.faculty_id = new mongoose.Types.ObjectId(req.user.faculty_id);
    }

    const departments = await Department.find(query)
      .populate('faculty_id', 'name code')
      .populate('created_by', 'username email role')
      .select('-__v');

    const formatted = departments.map(dept => {
      const d = dept.toObject();
      d.created_at = formatDateTime(d.created_at);
      d.updated_at = formatDateTime(d.updated_at);
      return d;
    });

    res.json(formatted);

  } catch (err) {
    return handleControllerError(res, err, 'Error fetching departments');
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "department id");

    const department = await Department.findById(req.params.id)
      .populate('faculty_id', 'name code')
      .populate('created_by', 'username email role')
      .select('-__v');

    assertCondition(department, 404, 'Department not found');

    assertFacultyScope(
      req.user,
      department.faculty_id,
      'You can only view departments in your own faculty'
    );

  const d = department.toObject();
  d.created_at = formatDateTime(d.created_at);
  d.updated_at = formatDateTime(d.updated_at);

    res.json(d);
  } catch (err) {
    return handleControllerError(res, err, 'Error fetching department');
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "department id");

    const department = await Department.findById(req.params.id);

    assertCondition(department, 404, 'Department not found');

    assertFacultyScope(
      req.user,
      department.faculty_id,
      'You can only delete departments in your own faculty'
    );

    await Faculty.findByIdAndUpdate(
      department.faculty_id,
      { $pull: { departments: department._id } }
    );

  await department.deleteOne();
    res.json({ message: 'Department deleted successfully' });

  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete department');
  }
};