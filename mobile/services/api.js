import { API_URL } from '../constants/api';

let onUnauthorized = null;

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  setOnUnauthorized(callback) {
    onUnauthorized = callback;
  }

  async request(endpoint, options = {}, token = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'mobile',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    let response = null;
    try {
      response = await fetch(url, config);
      
      let data;
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      try {
        if (isJson) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = {
            error: `Server error (${response.status})`,
            message: text.substring(0, 200) || `Request failed with status ${response.status}`,
          };
        }
      } catch (parseError) {
        data = {
          error: `Server error (${response.status})`,
          message: `Failed to parse server response`,
        };
      }
      
      if (!response.ok) {
        const isAuthError = response.status === 401 || response.status === 403;
        const msg = (data.error || data.message || "").toLowerCase();
        const isInvalidToken = msg.includes("invalid token") || msg.includes("unauthorized") || msg.includes("no token");
        if (isAuthError && isInvalidToken && typeof onUnauthorized === "function") {
          try {
            onUnauthorized();
          } catch (e) {
            if (__DEV__) console.log("onUnauthorized error:", e);
          }
        }
        if (__DEV__) {
          if (response.status >= 500) {
            console.error(`❌ API Server Error [${endpoint}]:`, {
              status: response.status,
              error: data.error || data.message,
            });
          } else {
            console.log(`API Error [${endpoint}]:`, {
              status: response.status,
              error: data.error || data.message,
            });
          }
        }
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }
      
      return { data, response };
    } catch (error) {
      if (__DEV__) {
        if (!response) {
          console.error(`❌ API Network Error [${endpoint}]:`, error.message);
        } else {
          console.log(`API Error [${endpoint}]:`, error.message);
        }
      }
      throw error;
    }
  }

  async loginStudent(studentId, password) {
    const { data } = await this.request('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        password,
      }),
    });
    return data;
  }

  async logoutStudent(token) {
    const { data } = await this.request('/api/auth/student/logout', {
      method: 'POST',
    }, token);
    return data;
  }

  async getProfile(token) {
    const { data } = await this.request('/api/users/profile', {
      method: 'GET',
    }, token);
    return data.user || data;
  }

  async updateProfile(token, profileData) {
    const formData = new FormData();
    
    if (profileData.photo) {
      formData.append('photo', {
        uri: profileData.photo.uri,
        type: profileData.photo.type || 'image/jpeg',
        name: profileData.photo.name || 'photo.jpg',
      });
    }

    Object.keys(profileData).forEach((key) => {
      if (key !== 'photo' && profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });

    const url = `${this.baseURL}/api/users/profile`;
    const headers = {
      'X-Client-Type': 'mobile',
      'Authorization': `Bearer ${token}`,
    };

    delete headers['Content-Type'];

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile');
    }
    
    return data;
  }

  async changePassword(token, currentPassword, newPassword) {
    const { data } = await this.request('/api/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }, token);
    return data;
  }

  async getElections(token) {
    const { data } = await this.request('/api/elections/', {
      method: 'GET',
    }, token);
    return data;
  }

  async getElectionById(token, electionId) {
    const { data } = await this.request(`/api/elections/${electionId}`, {
      method: 'GET',
    }, token);
    return data;
  }

  async getEligibleElections(token, studentId) {
    try {
      const { data } = await this.request(`/api/elections/eligible/${studentId}`, {
        method: 'GET',
      }, token);
      
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data && Array.isArray(data.elections)) {
        return data.elections;
      }
      
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getCandidates(token) {
    const { data } = await this.request('/api/candidates/', {
      method: 'GET',
    }, token);
    return data;
  }

  async getCandidateById(token, candidateId) {
    const { data } = await this.request(`/api/candidates/${candidateId}`, {
      method: 'GET',
    }, token);
    return data;
  }

  async getCandidatesByElection(token, electionId) {
    const { data } = await this.request(`/api/candidates/by-election/${electionId}`, {
      method: 'GET',
    }, token);
    return data;
  }

  async voteForCandidate(token, candidateIds, electionId) {
    const candidate_ids = Array.isArray(candidateIds) ? candidateIds : [candidateIds];
    
    if (!Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      throw new Error('Candidate IDs must be a non-empty array');
    }
    
    if (!electionId) {
      throw new Error('Election ID is required');
    }
    
    const normalizedCandidateIds = candidate_ids.map(id => String(id));
    const uniqueCandidateIds = [...new Set(normalizedCandidateIds)];
    
    if (uniqueCandidateIds.length !== 2) {
      if (uniqueCandidateIds.length !== normalizedCandidateIds.length) {
        throw new Error('Duplicate candidate IDs detected. Each candidate can only be voted for once.');
      }
      throw new Error('You must vote for exactly 2 unique candidates');
    }
    
    const payload = {
      candidate_ids: uniqueCandidateIds,
      election_id: String(electionId),
    };
    
    try {
      const { data } = await this.request('/api/votes/voteForCandidate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getElectionResults(token, electionId) {
    const { data } = await this.request(`/api/results/${electionId}`, {
      method: 'GET',
    }, token);
    return data;
  }

  async getNotifications(token) {
    const { data } = await this.request('/api/notifications/', {
      method: 'GET',
    }, token);
    return data;
  }

  async getUnreadNotificationCount(token) {
    const { data } = await this.request('/api/notifications/unread-count', {
      method: 'GET',
    }, token);
    return data;
  }

  async markNotificationAsRead(token, notificationId) {
    const { data } = await this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }, token);
    return data;
  }

  async markAllNotificationsAsRead(token) {
    const { data } = await this.request('/api/notifications/read-all', {
      method: 'PATCH',
    }, token);
    return data;
  }

  async deleteNotification(token, notificationId) {
    const { data } = await this.request(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    }, token);
    return data;
  }

  async healthCheck() {
    const { data } = await this.request('/api/health', {
      method: 'GET',
    });
    return data;
  }

  async chatWithAssistant(token, payload) {
    const { message, language, electionId, facultyId } = payload;
    const { data } = await this.request('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message: message || '',
        language: language || 'so',
        electionId: electionId || undefined,
        facultyId: facultyId || undefined,
      }),
    }, token);
    return data;
  }
}

export default new ApiService();
