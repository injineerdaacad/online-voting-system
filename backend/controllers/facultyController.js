import mongoose from "mongoose";
import { AdminRoleEnum, Faculty, Department } from "../models/index.js";
import {
  normalizeString,
  formatDateTime,
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
} from "../utils/controllerHelpers.js";

export const addFaculty = async (req, res) => {
  try {
    const { name, code, departments } = req.body;

    assertCondition(isSuperAdmin(req.user), 403, "Only Super Admins can create faculties");
    assertCondition(name && code, 400, "Faculty name and code are required");

    const normalizedName = normalizeString(name);
    const normalizedCode = code.trim().toUpperCase();

    const existingFaculty = await Faculty.findOne({
      $or: [{ name: normalizedName }, { code: normalizedCode }],
    });
    assertCondition(!existingFaculty, 400, "Faculty name or code already exists");

    const faculty = await Faculty.create({
      name: normalizedName,
      code: normalizedCode,
      departments: [],
      created_by: req.user.id,
    });

    if (departments && Array.isArray(departments) && departments.length > 0) {
      const departmentCodes = departments.map((dept) => dept.code.trim().toUpperCase());
      const existingDepartments = await Department.find({ code: { $in: departmentCodes } });
      assertCondition(existingDepartments.length === 0, 400, "One or more department codes already exist");

      const departmentDocs = await Department.insertMany(
        departments.map((dept) => ({
          name: normalizeString(dept.name),
          code: dept.code.trim().toUpperCase(),
          faculty_id: faculty._id,
          created_by: req.user.id,
        }))
      );

      faculty.departments = departmentDocs.map((dep) => dep._id);
      await faculty.save();

      return res.status(201).json({ message: "Faculty and departments created", faculty });
    }

    return res.status(201).json({ message: "Faculty created successfully", faculty });
  } catch (err) {
    return handleControllerError(res, err, "Failed to add faculty");
  }
};

export const updateFaculty = async (req, res) => {
  try {
    assertCondition(isSuperAdmin(req.user), 403, "Only Super Admins can update faculties");
    ensureValidObjectId(req.params.id, "faculty id");

    const { name, code, departments } = req.body;

    const existingFaculty = await Faculty.findById(req.params.id).populate("departments");
    assertCondition(existingFaculty, 404, "Faculty not found");

    if (name) {
      const nameExists = await Faculty.findOne({
        name: normalizeString(name),
        _id: { $ne: req.params.id },
      });
      assertCondition(!nameExists, 400, "Faculty name already exists");
    }

    if (code) {
      const codeExists = await Faculty.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: req.params.id },
      });
      assertCondition(!codeExists, 400, "Faculty code already exists");
    }

    if (departments && Array.isArray(departments)) {
      assertCondition(departments.length > 0, 400, "At least one department is required");

      const currentDepartmentCodes = existingFaculty.departments.map((d) => d.code);
      const newDepartmentCodes = departments
        .filter((dept) => !currentDepartmentCodes.includes(dept.code))
        .map((dept) => dept.code.trim().toUpperCase());

      if (newDepartmentCodes.length > 0) {
        const existingDepartments = await Department.find({
          code: { $in: newDepartmentCodes },
          faculty_id: { $ne: req.params.id },
        });
        assertCondition(existingDepartments.length === 0, 400, "One or more department codes already exist in other faculties");
      }

      const currentDepartmentIds = existingFaculty.departments.map((d) => d._id.toString());
      const updatedDepartmentIds = [];

      for (const dept of departments) {
        if (dept._id) {
          const existingDept = existingFaculty.departments.find((d) => d._id.toString() === dept._id);
          if (existingDept) {
            const updated = await Department.findByIdAndUpdate(
              dept._id,
              {
                name: normalizeString(dept.name),
                code: dept.code.trim().toUpperCase(),
              },
              { new: true }
            );
            updatedDepartmentIds.push(updated._id.toString());
          }
        } else {
          const newDepartment = await Department.create({
            name: normalizeString(dept.name),
            code: dept.code.trim().toUpperCase(),
            faculty_id: req.params.id,
            created_by: req.user.id,
          });
          updatedDepartmentIds.push(newDepartment._id.toString());
        }
      }

      const departmentsToRemove = currentDepartmentIds.filter((id) => !updatedDepartmentIds.includes(id));
      if (departmentsToRemove.length > 0) {
        await Department.deleteMany({ _id: { $in: departmentsToRemove } });
      }

      const updated = await Faculty.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name: normalizeString(name) }),
          ...(code && { code: code.trim().toUpperCase() }),
          departments: updatedDepartmentIds,
          updated_by: req.user.id,
        },
        { new: true }
      ).populate("departments", "name code");

      return res.json({ message: "Faculty and departments updated successfully", updated });
    }

    const updated = await Faculty.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: normalizeString(name) }),
        ...(code && { code: code.trim().toUpperCase() }),
        updated_by: req.user.id,
      },
      { new: true }
    );

    return res.json({ message: "Faculty updated successfully", updated });
  } catch (err) {
    return handleControllerError(res, err, "Update failed");
  }
};

export const getAllFaculties = async (req, res) => {
  try {
    let query = {};
    if (!isSuperAdmin(req.user)) {
      assertCondition(req.user.faculty_id, 403, "Faculty Admin must be assigned to a faculty");
      ensureValidObjectId(req.user.faculty_id, "faculty_id");
      query._id = new mongoose.Types.ObjectId(req.user.faculty_id);
    }

    const faculties = await Faculty.find(query)
      .populate('created_by', 'username email role')
      .populate('departments', 'name code')
      .select('-__v');

    const formatted = faculties.map(f => {
      const faculty = f.toObject();
      faculty.created_at = formatDateTime(faculty.created_at);
      faculty.updated_at = formatDateTime(faculty.updated_at);
      return faculty;
    });

    res.json(formatted);

  } catch (err) {
    return handleControllerError(res, err, 'Error fetching faculties');
  }
};

export const getFacultyById = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, 'faculty id');

    const faculty = await Faculty.findById(req.params.id)
      .populate('created_by', 'username email role')
      .populate('departments', 'name code')
      .select('-__v');

    assertCondition(faculty, 404, 'Faculty not found');

    if (!isSuperAdmin(req.user)) {
      assertCondition(
        faculty._id.toString() === req.user.faculty_id.toString(),
        403,
        'Access denied to other faculties'
      );
    }

  const f = faculty.toObject();
  f.created_at = formatDateTime(f.created_at);
  f.updated_at = formatDateTime(f.updated_at);

    return res.json(f);

  } catch (err) {
    return handleControllerError(res, err, 'Error fetching faculty');
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    assertCondition(isSuperAdmin(req.user), 403, 'Only Super Admins can delete faculties');
    ensureValidObjectId(req.params.id, 'faculty id');

    const deleted = await Faculty.findByIdAndDelete(req.params.id);
    assertCondition(deleted, 404, 'Faculty not found');

    await Department.updateMany({ faculty_id: req.params.id }, { faculty_id: null });

    return res.json({ message: 'Faculty deleted successfully' });

  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete faculty');
  }
};