import axios from 'axios';

export const fetchStudentFromSNU = async (student_id) => {
  try {
    const apiUrl = process.env.UNIVERSITY_API_URL;
    if (!apiUrl) {
      throw {
        status: 500,
        message: 'SNU API URL is not configured'
      };
    }

    const timeout = parseInt(process.env.UNIVERSITY_API_TIMEOUT) || 10000;

    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const endpoint = `${baseUrl}/api/student-list`;

    const response = await axios.post(
      endpoint,
      { student_id },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: timeout
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data?.message || 'SNU API request failed',
        data: error.response.data
      };
    } else if (error.request) {
      throw {
        status: 503,
        message: 'SNU API is unavailable or timeout occurred',
        timeout: true
      };
    } else {
      throw {
        status: 500,
        message: error.message || 'Error calling SNU API'
      };
    }
  }
};