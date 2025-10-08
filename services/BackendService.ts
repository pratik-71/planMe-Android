// import {User} from './SupabaseService';

const BACKEND_URL = 'https://planme-backend-eduf.onrender.com/api';

export interface BackendUser {
  user_id: string;
  name: string;
  email: string;
  id?: number;
  streak?: number;
  protein_goal?: number;
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

  static async updateProteinGoal(userId: string, proteinGoal: number) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/user/${encodeURIComponent(userId)}/protein-goal`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({protein_goal: proteinGoal}),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating protein goal:', error);
      throw error;
    }
  }

  // ===== Misc (food) =====
  static async getTodayMisc(userId: string) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/misc/today/${encodeURIComponent(userId)}`,
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching today misc:', error);
      throw error;
    }
  }

  static async addTodayProtein(userId: string, protein: number) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/misc/today/${encodeURIComponent(userId)}/protein`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({protein}),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating today protein:', error);
      throw error;
    }
  }

  static async getProteinHistory(userId: string, days = 10, offsetDays = 0) {
    try {
      const url = `${BACKEND_URL}/misc/protein-history/${encodeURIComponent(
        userId,
      )}?days=${days}&offsetDays=${offsetDays}`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching protein history:', error);
      throw error;
    }
  }

  // ===== Bucket List (JSONB Array of Objects) =====
  static async getBucketList(userId: string) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/bucket-list/${encodeURIComponent(userId)}`,
        {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching bucket list:', error);
      throw error;
    }
  }

  static async addBucketListItem(
    userId: string,
    title: string,
    description: string = '',
  ) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/bucket-list/${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({title, description}),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error adding bucket list item:', error);
      throw error;
    }
  }

  static async updateBucketList(userId: string, bucketList: any[]) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/bucket-list/${encodeURIComponent(userId)}`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({bucketList}),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating bucket list:', error);
      throw error;
    }
  }

  static async reorderBucketList(userId: string, reorderedItems: any[]) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/bucket-list/${encodeURIComponent(userId)}/reorder`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({reorderedItems}),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error reordering bucket list:', error);
      throw error;
    }
  }
}
