import moment from 'moment-timezone';

export const DEFAULT_TIMEZONE = "Africa/Mogadishu";

export const toCapitalize = (string: string): string => {
  return string
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const parseBackendDate = (dateStr: string | null | undefined): moment.Moment | null => {
  if (!dateStr) return null;
  
  if (typeof dateStr === 'string' && dateStr.includes('Date') && dateStr.includes('time')) {
    const formats = [
      'dddd Date DD-MM-YYYY time h:mm A',
      'dddd Date DD-MM-YYYY time hh:mm A',
      'dddd Date D-MM-YYYY time h:mm A',
      'dddd Date D-MM-YYYY time hh:mm A',
    ];
    
    for (const format of formats) {
      const parsed = moment(dateStr, format, true);
      if (parsed.isValid()) {
        return parsed;
      }
    }
    
    const dateMatch = dateStr.match(/Date\s+(\d{1,2})-(\d{1,2})-(\d{4})/);
    const timeMatch = dateStr.match(/time\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
    
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      let dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      if (timeMatch) {
        const [, hour, minute, ampm] = timeMatch;
        let hour24 = parseInt(hour, 10);
        if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        dateTimeStr += ` ${hour24.toString().padStart(2, '0')}:${minute}:00`;
      }
      
      const parsed = moment(dateTimeStr, timeMatch ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD', true);
      if (parsed.isValid()) {
        return parsed;
      }
    }
  }
  
  const parsed = moment(dateStr);
  return parsed.isValid() ? parsed : null;
};

export const formatDateTime = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  const dateStr: string = date instanceof Date ? date.toISOString() : String(date);
  const parsed = parseBackendDate(dateStr);
  return parsed ? parsed.format("MMM D, YYYY h:mm A") : null;
};

export const formatDateOnly = (dateStr: string | null | undefined): string => {
  const parsed = parseBackendDate(dateStr);
  return parsed ? parsed.format('MMM D, YYYY') : 'N/A';
};

export const toDateInTimeZone = (
  value: Date | string | null, 
  timezone: string = DEFAULT_TIMEZONE
): Date | null => {
  return value ? moment.tz(value, timezone).toDate() : null;
};

export const formatDateInTimeZone = (
  value: Date | string | null,
  timezone: string = DEFAULT_TIMEZONE,
  format: string = "MMM D, YYYY h:mm A"
): string | null => {
  return value ? moment.tz(value, timezone).format(format) : null;
};

export const formatUserName = (user: any): string => {
  if (user?.full_name) return user.full_name;
  if (user?.name) return user.name;
  if (user?.username) return user.username;
  return user?.email || 'Unknown User';
};

export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Faculty Admin',
    'student': 'Student'
  };
  return roleMap[role] || role;
};

export const formatUserStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'locked': 'Locked',
    'pending': 'Pending'
  };
  return statusMap[status] || status;
};

export const formatElectionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

export const formatElectionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'president': 'President',
    'vice-president': 'Vice President',
    'secretary': 'Secretary',
    'treasurer': 'Treasurer',
    'representative': 'Representative'
  };
  return typeMap[type] || type;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatRelativeTime = (date: Date | string): string => {
  return moment(date).fromNow();
};

export const formatTimeAgo = (date: Date | string): string => {
  const now = moment();
  const past = moment(date);
  const diff = now.diff(past);
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} days ago`;
  
  return past.format('MMM D, YYYY');
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

export const formatStudentId = (studentId: string): string => {
  return studentId.toUpperCase();
};

export const formatFacultyName = (faculty: any): string => {
  if (typeof faculty === 'string') return faculty;
  return faculty?.name || 'Unknown Faculty';
};

export const formatDepartmentName = (department: any): string => {
  if (typeof department === 'string') return department;
  return department?.name || 'Unknown Department';
};

export const formatVotingHistory = (hasVoted: any[] = []): any[] => {
  if (!Array.isArray(hasVoted)) return [];
  
  return hasVoted.map((vote) => {
    const election = vote?.election_id;
    const faculty = election?.faculty_id;

    if (!election) {
      return {
        election_id: null,
        voted_at: vote?.voted_at || null,
        status: null,
        type: null,
        title: null,
        faculty: null,
        faculty_id: null,
        _id: vote?._id,
      };
    }

    return {
      election_id: election?._id || election,
      voted_at: vote?.voted_at || null,
      status: election?.status || null,
      type: election?.type || null,
      title: election?.title || null,
      faculty: faculty?.name || null,
      faculty_id: faculty?._id || faculty,
      _id: vote?._id,
    };
  });
};

export const formatAdminOutput = (admin: any): any => {
  return {
    id: admin._id,
    username: admin.username,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    faculty: admin.faculty_id?.name || null,
    department: admin.department,
    is_locked: admin.is_locked,
    is_login: admin.is_login,
    created_at: admin.createdAt,
    last_login: admin.last_login,
    created_by: admin.created_by ? {
      id: admin.created_by._id,
      username: admin.created_by.username,
      email: admin.created_by.email,
      role: admin.created_by.role,
    } : null,
  };
};

export const formatStudentOutput = (student: any): any => {
  return {
    id: student._id,
    student_id: student.student_id,
    full_name: student.full_name,
    email: student.email,
    phone: student.phone,
    role: student.role,
    status: student.status,
    faculty: student.faculty_id?.name || null,
    department: student.department?.name || null,
    year_of_study: student.year_of_study,
    is_locked: student.is_locked,
    is_login: student.is_login,
    created_at: student.createdAt,
    last_login: student.last_login,
  };
};
