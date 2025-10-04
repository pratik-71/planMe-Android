import {useAuthStore} from '../stores/authStore';

const BACKEND_URL = 'https://planme-backend-eduf.onrender.com/api';

export interface TemplateReminder {
  title: string;
  time: string; // HH:MM format
}

export interface Template {
  id?: number;
  user_id: string;
  name: string;
  reminders: TemplateReminder[];
  created_at?: string;
  updated_at?: string;
}

export class TemplateService {
  /**
   * Create a new template
   */
  static async createTemplate(
    name: string,
    reminders: TemplateReminder[],
  ): Promise<Template> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name,
          reminders,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get all templates for the current user
   */
  static async getUserTemplates(): Promise<Template[]> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/templates/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: number): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/templates/${user.id}/${templateId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
}
