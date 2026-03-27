import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  Admin,
  AdminRoleEnum,
  Student,
  StudentRoleEnum
} from "../models/index.js";
import {
  assertCondition,
  ensureValidObjectId,
  handleControllerError,
} from "../utils/controllerHelpers.js";

export const loginAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    assertCondition(username || email && password, 400, "Email/username and password are required");

    const loginKey = typeof username === "string" ? username.trim().toLowerCase() : email.trim().toLowerCase();
    const admin = await Admin.findOne({
      $or: [{ email: loginKey }, { username: loginKey }],
    })
      .populate("created_by", "username email role")
      .populate({
        path: "faculty_id",
        select: "name code departments",
      });

    assertCondition(admin, 404, "Admin not found");

    assertCondition(!admin.is_locked, 403, "Account locked. Contact Super Admin.");

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    assertCondition(isMatch, 401, "Invalid credentials");

    if (admin.role !== AdminRoleEnum.SUPER_ADMIN) {
      assertCondition(admin.faculty_id, 403, "Admin is missing faculty assignment");
    }

    admin.attempt_login = 0;
    admin.is_locked = false;
    admin.last_login = new Date();
    admin.is_login = true;

    await admin.save();

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        faculty_id: admin.faculty_id ? admin.faculty_id._id : null,
        department: admin.department ? admin.department : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    const userResponse = {
      _id: admin._id,
      id: admin._id,
      username: admin.username || null,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone || null,
      role: admin.role,
      photo_url: admin.photo_url || null,
      photo_id: admin.photo_id || null,
      faculty: admin.faculty_id ? admin.faculty_id.name : null,
      faculty_id: admin.faculty_id ? {
        _id: admin.faculty_id._id,
        name: admin.faculty_id.name,
        code: admin.faculty_id.code
      } : null,
      department: admin.department || null,
      created_by: admin.created_by
        ? {
            id: admin.created_by._id,
            username: admin.created_by.username,
            email: admin.created_by.email,
            role: admin.created_by.role,
          }
        : null,
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (err) {
    return handleControllerError(res, err, "Server error");
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    ensureValidObjectId(req.user.id, "admin id");
    await Admin.findByIdAndUpdate(req.user.id, {
      $set: { is_login: false, last_logout: new Date() },
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({ message: "Logout successful" });

  } catch (err) {
    return handleControllerError(res, err, "Logout failed");
  }
};

export const unlockUser = async (req, res) => {
  const { id, type } = req.body;

  try {
    if (type === AdminRoleEnum.ADMIN) {
      await Admin.findByIdAndUpdate(id, {
        $set: { is_locked: false, attempt_login: 0 },
      });
    }

    else if (type === StudentRoleEnum.STUDENT) {
      await Student.findByIdAndUpdate(id, {
        $set: { is_locked: false, attempt_login: 0 },
      });
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    res.json({ message: `${type} account unlocked` });
  } catch (err) {
    res.status(500).json({ error: "Failed to unlock user" });
  }
};

export const loginStudent = async (req, res) => {
  const { student_id, password } = req.body;

  try {
    assertCondition(student_id, 400, "Student ID is required");
    assertCondition(password, 400, "Password is required");

    const normalizedId = String(student_id).trim().toUpperCase();

    const student = await Student.findOne({ student_id: normalizedId })
      .populate({ path: "department", select: "name code" })
      .populate({ path: "faculty_id", select: "name code" });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (student.is_locked) {
      return res.status(403).json({
        error: "Account locked due to multiple failed login attempts",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);

    if (!isMatch) {
      student.attempt_login = (student.attempt_login || 0) + 1;
      student.attempt_login_time = new Date();

      if (student.attempt_login >= 4) {
        student.is_locked = true;
      }

      await student.save();

      const errorMsg = student.is_locked
        ? "Account locked. Contact admin."
        : `Invalid password. ${student.attempt_login}/4 attempts used.`;

      return res.status(401).json({
        error: errorMsg,
        message: errorMsg,
      });
    }

    student.attempt_login = 0;
    student.is_locked = false;
    student.last_login = new Date();
    student.is_login = true;

    await student.save();

    const token = jwt.sign(
      {
        id: student._id,
        role: student.role,
        faculty_id: student.faculty_id?._id || student.faculty_id,
        department: student.department?._id || student.department,
      },

      process.env.JWT_SECRET,

      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({
      token,

      student: {
        id: student._id,
        student_id: student.student_id,
        full_name: student.full_name,
        role: student.role,
        status: student.status,
        department: student.department?.name || null,
        department_id: student.department?._id || student.department,
        faculty: student.faculty_id?.name || null,
        faculty_id: student.faculty_id?._id || student.faculty_id,
        created_at: student.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const logoutStudent = async (req, res) => {
  const { id } = req.user;

  try {
    await Student.findByIdAndUpdate(id, {
      $set: { is_login: false, last_logout: new Date() },
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
};