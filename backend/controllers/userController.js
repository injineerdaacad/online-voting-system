import fs from "fs-extra";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  uploadImageToCloudinary,
  formatAdminOutput,
  assertCondition,
  assertSuperAdmin,
  HttpError,
  ensureValidObjectId,
  handleControllerError,
  isSuperAdmin,
  normalizeString,
} from "../utils/controllerHelpers.js";
import { Admin, AdminRoleEnum, Faculty, Department } from "../models/index.js";
import { UserStatusEnum } from "../utils/constants.js";
import { sessionManager } from "../config/sessionStore.js";
import { uploadImage, downloadAndUploadImage } from "../utils/imageUploader.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { fetchStudentFromSNU } from "../utils/universityApi.js";

export const createUser = async (req, res) => {
  try {
    const {
      full_name,
      username,
      email,
      phone,
      password,
      confirm_password,
      role,
      faculty_id,
      department,
      batch,
      graduation_year,
      student_id,
      photo_url,
      status
    } = req.body;

    assertCondition(full_name, 400, "Full name is required");
    assertCondition(username, 400, "Username is required");

    let finalEmail = email;
    if (role === 'Student' && (!email || email === 'NaN' || email.toLowerCase() === 'nan')) {
      const emailDomain = process.env.UNIVERSITY_EMAIL_DOMAIN;
      assertCondition(emailDomain && emailDomain.trim(), 500, "UNIVERSITY_EMAIL_DOMAIN is not configured");
      finalEmail = student_id
        ? `student.${student_id.toLowerCase()}@${emailDomain.trim()}`
        : `student.${username}@${emailDomain.trim()}`;
    } else {
      assertCondition(email, 400, "Email is required");
      finalEmail = email.trim().toLowerCase();
    }

    assertCondition(password, 400, "Password is required");
    assertCondition(confirm_password, 400, "Confirm password is required");
    assertCondition(role, 400, "Role is required");
    assertCondition(password === confirm_password, 400, "Passwords do not match");
    assertCondition(password.length >= 6, 400, "Password must be at least 6 characters");

    const norm = {
      full_name: normalizeString(full_name),
      username: username.trim().toLowerCase(),
      email: finalEmail,
      phone: phone ? phone.trim().replace(/\s+/g, '').replace(/\.0$/, '') : null,
      role,
      faculty_id,
      department,
      batch: batch ? normalizeString(batch) : batch,
      graduation_year
    };

    const usernameExists = await Admin.findOne({ username: norm.username });
    assertCondition(!usernameExists, 400, "Username is already in use");

    const emailExists = await Admin.findOne({ email: norm.email });
    assertCondition(!emailExists, 400, "Email is already in use");

    if (norm.phone) {
      const phoneExists = await Admin.findOne({ phone: norm.phone });
      assertCondition(!phoneExists, 400, "Phone number is already in use");
    }

    if (role === AdminRoleEnum.SUPER_ADMIN) {
      assertCondition(!faculty_id, 400, "Super Admin must not have faculty_id");
    } else if (role === AdminRoleEnum.ADMIN) {
      assertCondition(faculty_id, 400, "Faculty Admin must have faculty_id");
      ensureValidObjectId(faculty_id, "faculty_id");
    } else if (role === 'Student') {
      assertCondition(faculty_id, 400, "Student must have faculty_id");
      assertCondition(department, 400, "Student must have department");
      assertCondition(batch, 400, "Student must have batch");
      ensureValidObjectId(faculty_id, "faculty_id");
      ensureValidObjectId(department, "department");
    }

    const userData = {
      full_name: norm.full_name,
      username: norm.username,
      email: norm.email,
      phone: norm.phone,
      password: password,
      role: norm.role,
      faculty_id: norm.faculty_id,
      department: norm.department,
      batch: norm.batch,
      graduation_year: norm.graduation_year,
      created_by: req.user.id,
    };

    if (role === 'Student') {
      assertCondition(student_id, 400, "Student ID is required for students");
      userData.student_id = student_id.toUpperCase();

      let finalPhotoUrl = photo_url;
      if (!finalPhotoUrl) {
        const apiUrl = process.env.UNIVERSITY_API_URL;
        if (apiUrl) {
          const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          finalPhotoUrl = `${baseUrl}/photos/students/${student_id.toUpperCase()}.jpg`;
        }
      }

      if (finalPhotoUrl) {
        userData.photo_url = finalPhotoUrl;

        if (finalPhotoUrl.startsWith('http')) {
          try {
            const uploadResult = await downloadAndUploadImage(finalPhotoUrl, 'students', student_id.toUpperCase());
            if (uploadResult.public_id && uploadResult.url && uploadResult.url.includes('cloudinary')) {
              userData.photo_url = uploadResult.url;
              userData.photo_id = uploadResult.public_id;
            }
          } catch (error) {
            console.error(`[createUser] Failed to upload student image for ${student_id} to Cloudinary, keeping original URL:`, error.message);
          }
        }
      }

      userData.status = status || UserStatusEnum.ACTIVE;
    }

    const user = new Admin(userData);

    await user.save();

    const populatedUser = await Admin.findById(user._id)
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role")
      .select("-password_hash");

    res.status(201).json({
      message: "User created successfully",
      user: populatedUser
    });

  } catch (err) {
    return handleControllerError(res, err, "Failed to create user");
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { full_name, username, email, phone, password, role, faculty_id, department } = req.body;

    const norm = {
      full_name: typeof full_name === 'string' ? normalizeString(full_name) : full_name,
      username: typeof username === 'string' ? username.trim().toLowerCase() : username,
      email: typeof email === 'string' ? email.trim().toLowerCase() : email,
      phone: typeof phone === 'string' ? phone.trim().replace(/\s+/g, '') : phone,
      role,
      faculty_id,
      department,
    };

    assertSuperAdmin(req.user, "Only Super Admin can create new Admins");

    assertCondition(password, 400, "Password is required");

    assertCondition(norm.full_name, 400, "Full name is required");
    assertCondition(norm.username, 400, "Username is required");
    assertCondition(norm.email, 400, "Email is required");
    assertCondition(norm.phone, 400, "Phone is required");

    assertCondition(
      role === AdminRoleEnum.SUPER_ADMIN ? !faculty_id : true,
      400,
      "Super Admin must not have faculty_id"
    );

    if (role === AdminRoleEnum.ADMIN) {
      assertCondition(faculty_id, 400, "Faculty Admin must have faculty_id");
      ensureValidObjectId(faculty_id, "faculty_id");
    }

    const usernameExists = await Admin.findOne({ username: norm.username });
    assertCondition(!usernameExists, 400, "Username is already in use");

    const emailExists = await Admin.findOne({ email: norm.email });
    assertCondition(!emailExists, 400, "Email is already in use");

    const phoneExists = await Admin.findOne({ phone: norm.phone });
    assertCondition(!phoneExists, 400, "Phone number is already in use");

    let faculty = null;
    if (role === AdminRoleEnum.ADMIN) {
      faculty = await Faculty.findById(faculty_id);
      assertCondition(faculty, 400, "Faculty not found");
    }

    let photo = null;
    let photo_id = null;
    if (req.file) {
      try {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error(
            "Invalid file type. Only JPEG, JPG, and PNG are allowed."
          );
        }

        if (req.file.size > maxSize) {
          throw new Error("File size too large. Maximum size is 5MB.");
        }

        const { isCloudinaryConfigured } = await import('../config/cloudinaryConfig.js');

        if (isCloudinaryConfigured) {
          const result = await uploadImageToCloudinary(req.file.path, "admins");
          photo = result.url;
          photo_id = result.public_id;
        } else {
          photo = `/uploads/${req.file.filename}`;
          photo_id = req.file.filename;
        }

      } catch (uploadError) {
        throw new HttpError(
          uploadError?.statusCode || 400,
          uploadError?.message || "Failed to upload image"
        );

      } finally {
        const { isCloudinaryConfigured } = await import('../config/cloudinaryConfig.js');
        if (isCloudinaryConfigured) {
          await fs.remove(req.file.path);
        }
      }
    }

    const admin = new Admin({
      full_name: norm.full_name,
      username: norm.username,
      email: norm.email,
      phone: norm.phone,
      role,
      faculty_id: role === AdminRoleEnum.ADMIN ? norm.faculty_id : null,
      department: null,
      password: password,
      created_by: req.user.id,
      photo,
      photo_url: photo,
      photo_id,
    });

    await admin.save();

    const populatedAdmin = await Admin.findById(admin._id)
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role")
      .select("-password_hash");

    res.status(201).json({ message: "Admin created", admin: populatedAdmin });

  } catch (err) {
    return handleControllerError(res, err, "Failed to create admin");
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const originalUrl = req.originalUrl || '';
    const baseUrl = req.baseUrl || '';
    const path = req.path || '';
    const fullPath = originalUrl || baseUrl || path;

    const isStudentRequest =
      fullPath.includes('/students') ||
      originalUrl.includes('/students') ||
      baseUrl.includes('/students') ||
      path.includes('/students') ||
      req.query.role === 'Student';

    let query = {};
    if (!isSuperAdmin(req.user)) {
      assertCondition(req.user.faculty_id, 403, "Faculty Admin must be assigned to a faculty");
      ensureValidObjectId(req.user.faculty_id, "faculty_id");
      query.faculty_id = new mongoose.Types.ObjectId(req.user.faculty_id);
    }

    if (isStudentRequest) {
      query.role = 'Student';
    } else if (req.query.role) {
      query.role = req.query.role;
    } else {

      query.role = { $in: [AdminRoleEnum.SUPER_ADMIN, AdminRoleEnum.ADMIN] };
    }

    const admins = await Admin.find(query)
      .select("-password_hash -__v")
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role");

    const formatted = admins.map((admin) => {
      const adminObj = admin.toObject();
      const formatted = formatAdminOutput(adminObj);

      if (!formatted.photo_url && formatted.student_id && formatted.role === 'Student') {
        const apiUrl = process.env.UNIVERSITY_API_URL;
        if (apiUrl) {
          const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          formatted.photo_url = `${baseUrl}/photos/students/${formatted.student_id.toUpperCase()}.jpg`;
        }
      }

      if (!('photo_url' in formatted)) {
        formatted.photo_url = adminObj.photo_url || null;
      }

      return formatted;
    });

    res.json(formatted);
  } catch (err) {
    return handleControllerError(res, err, "Server error");
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { username, email, phone, role, faculty_id, department, full_name, name, status } = req.body;

    const norm = {
      username: typeof username === 'string' ? username.trim().toLowerCase() : undefined,
      email: typeof email === 'string' ? email.trim().toLowerCase() : undefined,
      phone: typeof phone === 'string' ? phone.trim().replace(/\s+/g, '') : undefined,
      full_name: typeof full_name === 'string' ? normalizeString(full_name) : (typeof name === 'string' ? normalizeString(name) : undefined),
      role,
      faculty_id,
      department,
    };

    ensureValidObjectId(req.params.id, "admin id");

    const adminToUpdate = await Admin.findById(req.params.id);
    assertCondition(adminToUpdate, 404, "Admin not found to update");

    if (norm.faculty_id) ensureValidObjectId(norm.faculty_id, "faculty_id");
    if (norm.department) ensureValidObjectId(norm.department, "department");

    if (!isSuperAdmin(req.user) && norm.role === AdminRoleEnum.SUPER_ADMIN) {
      throw new HttpError(
        403,
        "Only Super Admin can change the role to Super Admin"
      );
    }

    if (!isSuperAdmin(req.user)) {
      assertCondition(
        !norm.faculty_id ||
          !adminToUpdate.faculty_id ||
          norm.faculty_id === adminToUpdate.faculty_id.toString(),
        403,
        "You cannot change the faculty for this admin"
      );

      assertCondition(
        !norm.department ||
          !adminToUpdate.department ||
          norm.department === adminToUpdate.department.toString(),
        403,
        "You cannot change the department for this admin"
      );
    }

    if (req.file) {
      try {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        const maxSize = 5 * 1024 * 1024;
        assertCondition(
          allowedTypes.includes(req.file.mimetype),
          400,
          "Invalid file type. Only JPEG, JPG, and PNG are allowed."
        );
        assertCondition(
          req.file.size <= maxSize,
          400,
          "File size too large. Maximum size is 5MB."
        );

        if (adminToUpdate.photo_id) {
          await cloudinary.uploader.destroy(adminToUpdate.photo_id);
        }

        const result = await uploadImageToCloudinary(req.file.path, "admins");
        adminToUpdate.photo = result.url;
        adminToUpdate.photo_url = result.url;
        adminToUpdate.photo_id = result.public_id;

      } catch (uploadError) {
        throw new HttpError(
          uploadError?.statusCode || 400,
          uploadError?.message || "Failed to upload image to Cloudinary"
        );
      } finally {
        await fs.remove(req.file.path);
      }
    }

    if (norm.username !== undefined) adminToUpdate.username = norm.username;
    if (norm.email !== undefined) adminToUpdate.email = norm.email;
    if (norm.phone !== undefined) adminToUpdate.phone = norm.phone;
    if (norm.role !== undefined) adminToUpdate.role = norm.role;
    if (norm.faculty_id !== undefined) adminToUpdate.faculty_id = norm.faculty_id;
    if (norm.department !== undefined) adminToUpdate.department = norm.department;

    if (status !== undefined) {
      adminToUpdate.status = status;
      if (status === 'Suspended') {
        adminToUpdate.is_locked = true;
      } else if (status === 'Active') {
        adminToUpdate.is_locked = false;
        adminToUpdate.attempt_login = 0;
        adminToUpdate.attempt_login_time = null;
      }
    }

    adminToUpdate.updated_by = req.user.id;
    await adminToUpdate.save();

    res.json({ message: "Admin updated successfully", updated: adminToUpdate });
  } catch (err) {
    return handleControllerError(res, err, "Update failed");
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    ensureValidObjectId(req.params.id, "admin id");

    const admin = await Admin.findById(req.params.id);
    assertCondition(admin, 404, "Admin not found to delete");

    if (admin.photo_id) {
      await cloudinary.uploader.destroy(admin.photo_id);
    }

    await admin.deleteOne();
    res.json({ message: "Admin deleted" });

  } catch (err) {
    return handleControllerError(res, err, "Delete failed");
  }
};

export const changeOwnPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.user.id;

  try {
    ensureValidObjectId(adminId, "admin id");

    assertCondition(newPassword, 400, "New password is required");

    const admin = await Admin.findById(adminId);
    assertCondition(admin, 404, "Admin not found");

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    assertCondition(isMatch, 401, "Current password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password_hash = hashed;
    admin.is_default_password = false;

    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    return handleControllerError(res, err, "Failed to update password");
  }
};

export const superAdminResetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    assertSuperAdmin(req.user, "Only Super Admin can reset admin passwords");
    ensureValidObjectId(id, "admin id");
    assertCondition(newPassword && newPassword.trim() !== "", 400, "New password cannot be empty");

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await Admin.findByIdAndUpdate(
      id,

      {
        password_hash: hashed,
        is_default_password: false
      },

      { new: true }
    );

    assertCondition(updated, 404, "Admin not found");

    res.json({ message: `Password reset for ${updated.username}` });
  } catch (err) {
    return handleControllerError(res, err, "Failed to reset password");
  }
};

export const getLockedAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ is_locked: true })
      .select("-password_hash -__v")
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role");

    const formatted = admins.map((a) => formatAdminOutput(a.toObject()));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: "Error fetching locked admins" });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Admin.findById(userId)
      .select("-password_hash")
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role")
      .populate("updated_by", "username email role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let sessionData = null;
    let isOnline = false;
    let lastSeen = user.last_login || user.updated_at;

    try {
      if (req.user.sessionId) {
        sessionData = await sessionManager.getSession(req.user.sessionId);
        isOnline = sessionData ? true : false;
        lastSeen = sessionData?.lastAccess || user.last_login || user.updated_at;
      }
    } catch (sessionError) {
      isOnline = false;
      lastSeen = user.last_login || user.updated_at;
    }

    if (!isOnline && user.last_login) {
      const lastLoginTime = new Date(user.last_login).getTime();
      const currentTime = new Date().getTime();
      const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);

      if (lastLoginTime > thirtyMinutesAgo) {
        isOnline = true;
        lastSeen = user.last_login;
      }
    }

    if (!isOnline && req.user && req.user.id) {
      isOnline = true;
      lastSeen = user.last_login || user.updated_at;
    }

    const profileData = {
      _id: user._id,
      id: user._id,
      username: user.username || null,
      student_id: user.student_id || null,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      status: user.status || 'active',
      photo_url: user.photo_url || null,
      photo_id: user.photo_id || null,
      faculty: user.faculty_id ? {
        id: user.faculty_id._id,
        name: user.faculty_id.name,
        code: user.faculty_id.code
      } : null,
      faculty_id: user.faculty_id ? {
        _id: user.faculty_id._id,
        name: user.faculty_id.name,
        code: user.faculty_id.code
      } : null,
      department: user.department ? {
        id: user.department._id,
        name: user.department.name,
        code: user.department.code
      } : null,
      batch: user.batch || null,
      graduation_year: user.graduation_year || null,
      has_voted: user.has_voted || [],
      attempt_login: user.attempt_login || 0,
      attempt_login_time: user.attempt_login_time || null,
      is_locked: user.is_locked || false,
      is_login: isOnline,
      last_login: user.last_login || null,
      last_logout: user.last_logout || null,
      last_seen: lastSeen,
      created_by: user.created_by ? {
        _id: user.created_by._id,
        username: user.created_by.username,
        email: user.created_by.email,
        role: user.created_by.role
      } : null,
      updated_by: user.updated_by ? {
        _id: user.updated_by._id,
        username: user.updated_by.username,
        email: user.updated_by.email,
        role: user.updated_by.role
      } : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.json({ user: profileData });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user profile" });
  }
};

export const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username, email, phone } = req.body;
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData = {};

    if (full_name) updateData.full_name = normalizeString(full_name);
    if (username) updateData.username = username.trim().toLowerCase();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone) updateData.phone = phone.trim().replace(/\s+/g, '');
    updateData.updated_by = req.user.id;

    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file.path, 'profiles');

        if (user.photo_id) {
          try {
            await cloudinary.uploader.destroy(user.photo_id);
          } catch (deleteError) {
          }
        }

        updateData.photo = uploadResult.url;
        updateData.photo_url = uploadResult.url;
        updateData.photo_id = uploadResult.public_id;

        const fs = await import('fs-extra');
        await fs.remove(req.file.path);
      } catch (uploadError) {
        return res.status(400).json({ error: 'Failed to upload image' });
      }
    }

    const updatedUser = await Admin.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash')
     .populate('faculty_id', 'name code')
     .populate('department', 'name code');

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating user profile" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    ensureValidObjectId(userId, "user id");
    const user = await Admin.findById(userId)
      .select("-password_hash")
      .populate("faculty_id", "name code")
      .populate("department", "name code")
      .populate("created_by", "username email role")
      .populate("updated_by", "username email role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!isSuperAdmin(req.user)) {
      if (user.faculty_id && req.user.faculty_id) {
        assertCondition(
          user.faculty_id._id.toString() === req.user.faculty_id.toString(),
          403,
          "Access denied to users from other faculties"
        );
      }
    }

    let sessionData = null;
    let isOnline = false;
    let lastSeen = user.last_login || user.updated_at;

    try {
      if (req.user.sessionId) {
        sessionData = await sessionManager.getSession(req.user.sessionId);
        isOnline = sessionData ? true : false;
        lastSeen = sessionData?.lastAccess || user.last_login || user.updated_at;
      }
    } catch (sessionError) {
      isOnline = false;
      lastSeen = user.last_login || user.updated_at;
    }

    if (!isOnline && user.last_login) {
      const lastLoginTime = new Date(user.last_login).getTime();
      const currentTime = new Date().getTime();
      const thirtyMinutesAgo = currentTime - (30 * 60 * 1000);

      if (lastLoginTime > thirtyMinutesAgo) {
        isOnline = true;
        lastSeen = user.last_login;
      }
    }

    if (!isOnline && req.user && req.user.id) {
      isOnline = true;
      lastSeen = user.last_login || user.updated_at;
    }

    let photoUrl = user.photo_url;
    if (!photoUrl && user.student_id && user.role === 'Student') {
      const apiUrl = process.env.UNIVERSITY_API_URL;
      if (apiUrl) {
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        photoUrl = `${baseUrl}/photos/students/${user.student_id.toUpperCase()}.jpg`;
      }
    }

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name || user.username || 'Unknown User',
      full_name: user.full_name || user.name || user.username,
      username: user.username,
      student_id: user.student_id || null,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status || 'active',
      faculty: user.faculty_id ? {
        id: user.faculty_id._id,
        name: user.faculty_id.name,
        code: user.faculty_id.code
      } : null,
      faculty_id: user.faculty_id,
      department: user.department ? {
        id: user.department._id,
        name: user.department.name,
        code: user.department.code
      } : null,
      batch: user.batch,
      graduation_year: user.graduation_year,
      has_voted: user.has_voted || [],
      attempt_login: user.attempt_login || 0,
      attempt_login_time: user.attempt_login_time,
      is_locked: user.is_locked || false,
      is_login: isOnline,
      last_login: user.last_login,
      last_logout: user.last_logout,
      last_seen: lastSeen,
      photo: user.photo,
      photo_url: photoUrl || user.photo_url || null,
      photo_id: user.photo_id,
      created_by: user.created_by,
      updated_by: user.updated_by,
      created_at: user.created_at,
      updated_at: user.updated_at,

      login_attempts: user.attempt_login || 0,
      account_locked: user.is_locked || false,
      member_since: user.created_at,
      account_status: user.status || 'active'
    };

    res.json(userData);
  } catch (error) {
    return handleControllerError(res, error, "Error fetching user details");
  }
};

export const lockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    ensureValidObjectId(userId, "user id");
    const user = await Admin.findById(userId);
    assertCondition(user, 404, "User not found");

    if (!isSuperAdmin(req.user)) {
      if (user.faculty_id && req.user.faculty_id) {
        assertCondition(
          user.faculty_id.toString() === req.user.faculty_id.toString(),
          403,
          "Access denied to users from other faculties"
        );
      }
    }

    user.status = 'Suspended';
    user.is_locked = true;
    user.updated_by = req.user.id;

    await user.save();

    res.json({
      message: "User locked successfully",
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        status: user.status,
        is_locked: user.is_locked
      }
    });
  } catch (error) {
    return handleControllerError(res, error, "Error locking user");
  }
};

export const unlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    ensureValidObjectId(userId, "user id");
    const user = await Admin.findById(userId);
    assertCondition(user, 404, "User not found");

    if (!isSuperAdmin(req.user)) {
      if (user.faculty_id && req.user.faculty_id) {
        assertCondition(
          user.faculty_id.toString() === req.user.faculty_id.toString(),
          403,
          "Access denied to users from other faculties"
        );
      }
    }

    user.status = 'Active';
    user.is_locked = false;
    user.attempt_login = 0;
    user.attempt_login_time = null;
    user.updated_by = req.user.id;

    await user.save();

    res.json({
      message: "User unlocked successfully",
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        status: user.status,
        is_locked: user.is_locked
      }
    });
  } catch (error) {
    return handleControllerError(res, error, "Error unlocking user");
  }
};

export const searchStudentIds = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ student_ids: [] });
    }

    const searchQuery = query.trim();

    const students = await Admin.find({
      role: 'Student',
      student_id: { $regex: `^${searchQuery}`, $options: 'i' }
    })
    .select('student_id full_name')
    .limit(10)
    .sort({ student_id: 1 })
    .lean();

    const studentIds = students.map(s => ({
      student_id: s.student_id,
      full_name: s.full_name
    }));

    res.json({ student_ids: studentIds });

  } catch (err) {
    return handleControllerError(res, err, "Failed to search student IDs");
  }
};

export const checkStudentInUniversityAPI = async (req, res) => {
  try {
    const { student_id } = req.params;

    assertCondition(student_id, 400, "Student ID is required");

    try {
      const snuResponse = await fetchStudentFromSNU(student_id);

      if (!snuResponse) {
        return res.json({
          exists_in_api: false,
          message: "Student not found in University API. Manual registration required."
        });
      }

      let studentData = null;
      if (snuResponse.success && snuResponse.data) {
        studentData = snuResponse.data;
      } else if (snuResponse.data && !snuResponse.success) {
        studentData = snuResponse.data;
      } else if (snuResponse.student_id || snuResponse.full_name) {
        studentData = snuResponse;
      }

      if (!studentData) {
        return res.json({
          exists_in_api: false,
          message: "Student not found in University API. Manual registration required."
        });
      }

      const facultyName = typeof studentData.faculty === 'string'
        ? studentData.faculty
        : (studentData.faculty?.name || studentData.faculty_name);
      const departmentName = typeof studentData.department === 'string'
        ? studentData.department
        : (studentData.department?.name || studentData.department_name);
      const facultyCode = typeof studentData.faculty === 'object'
        ? (studentData.faculty?.code || studentData.faculty_code)
        : null;
      const departmentCode = typeof studentData.department === 'object'
        ? (studentData.department?.code || studentData.department_code)
        : null;

      let faculty = null;
      let department = null;
      let canAutoRegister = false;

      if (facultyName || facultyCode) {
        faculty = await Faculty.findOne({
          $or: [
            { name: normalizeString(facultyName) },
            { code: facultyCode?.trim().toUpperCase() }
          ]
        });
      }

      if (departmentName || departmentCode) {
        department = await Department.findOne({
          $or: [
            { name: normalizeString(departmentName) },
            { code: departmentCode?.trim().toUpperCase() }
          ]
        });
      }

      if (faculty && department) {
        canAutoRegister = true;
      }

      let photoUrl = studentData.photo_url || studentData.photoUrl || studentData.photo || null;

      if (!photoUrl && studentData.student_id) {
        const apiUrl = process.env.UNIVERSITY_API_URL;
        if (apiUrl) {
          const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          photoUrl = `${baseUrl}/photos/students/${studentData.student_id.toUpperCase()}.jpg`;
        }
      }

      const response = {
        exists_in_api: true,
        can_auto_register: canAutoRegister,
        student_data: {
          student_id: studentData.student_id,
          full_name: normalizeString(studentData.full_name || studentData.name),
          email: studentData.email && studentData.email !== 'NaN'
            ? studentData.email.trim().toLowerCase()
            : null,
          phone: studentData.phone && studentData.phone !== 'NaN'
            ? studentData.phone.toString().trim().replace(/\s+/g, '').replace(/\.0$/, '')
            : null,
          batch: studentData.batch ? normalizeString(studentData.batch) : null,
          graduation_year: studentData.graduation_year || null,
          photo_url: photoUrl,
          status: studentData.status || 'Active',
          faculty: {
            name: facultyName ? normalizeString(facultyName) : null,
            code: facultyCode?.trim().toUpperCase() || null,
            exists_in_system: !!faculty,
            faculty_id: faculty?._id || null
          },
          department: {
            name: departmentName ? normalizeString(departmentName) : null,
            code: departmentCode?.trim().toUpperCase() || null,
            exists_in_system: !!department,
            department_id: department?._id || null
          }
        }
      };

      if (!canAutoRegister) {
        response.message = faculty && !department
          ? "Faculty found but department not found in system. Please add department first."
          : !faculty && department
          ? "Department found but faculty not found in system. Please add faculty first."
          : "Faculty and department not found in system. Please add them first.";
      }

      res.json(response);

    } catch (apiError) {
      if (apiError.status === 404 || apiError.status === 400) {
        return res.json({
          exists_in_api: false,
          message: "Student not found in University API. Manual registration required."
        });
      }

      if (apiError.timeout || apiError.status === 503) {
        return res.status(503).json({
          exists_in_api: false,
          message: "University API is currently unavailable. Please use manual registration.",
          api_unavailable: true
        });
      }

      throw apiError;
    }

  } catch (err) {
    return handleControllerError(res, err, "Failed to check student in University API");
  }
};