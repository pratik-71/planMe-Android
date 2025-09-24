// import {User} from './SupabaseService';

const BACKEND_URL = 'https://planme-backend-eduf.onrender.com/api';

export interface BackendUser {
  user_id: string;
  name: string;
  email: string;
  id?: number;
}

export interface UserCheckResponse {
  success: boolean;
  user: BackendUser | null;
  isNew: boolean;
}

export class BackendService {
  static async checkUser(
    email: string,
    userId: string,
    name?: string,
  ): Promise<UserCheckResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/user/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          // IMPORTANT: do NOT send Google name here to prevent auto-creation
          // with third-party profile names. Backend should only check existence.
          name: name ?? '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  }

  static async createUser(
    userId: string,
    email: string,
    name: string,
  ): Promise<BackendUser> {
    try {
      const response = await fetch(`${BACKEND_URL}/user/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          name: name,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.user) {
        return data.user;
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserPlans(userId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/plan_day/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user plans:', error);
      throw error;
    }
  }

  static async getDayPlanByDate(userId: string, dateISO: string) {
    const list = await this.getUserPlans(userId);
    if (Array.isArray(list?.data)) {
      const match = list.data.find((p: any) => p.selected_date === dateISO);
      return match || null;
    }
    return null;
  }

  static async saveDayPlan(
    userId: string,
    dayName: string,
    selectedDate: string,
    timeSlots: any[],
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/plan_day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          dayName,
          selectedDate,
          timeSlots,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving day plan:', error);
      throw error;
    }
  }

  // ===== Daily Plan (bulk with reminders/subgoals) =====
  static async addDailyPlan(
    userId: string,
    planName: string,
    planDate: string,
    reminders: any[],
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/addPlan`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, planName, planDate, reminders}),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error adding daily plan:', error);
      throw error;
    }
  }

  static async getAllPlansForDate(userId: string, dateISO: string) {
    try {
      const url = `${BACKEND_URL}/getAllPlansForDate?userId=${encodeURIComponent(
        userId,
      )}&date=${encodeURIComponent(dateISO)}`;
      const response = await fetch(url, {method: 'GET'});

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all plans for date:', error);
      throw error;
    }
  }

  static async updateDailyPlan(planId: number, reminders: any[]) {
    try {
      const response = await fetch(`${BACKEND_URL}/updatePlan`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({planId, reminders}),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating daily plan:', error);
      throw error;
    }
  }

  static async getUserDailyPlans(userId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/daily-plans/${userId}`, {
        method: 'GET',
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user daily plans:', error);
      throw error;
    }
  }
}
