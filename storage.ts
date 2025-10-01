/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Define a type for our application data for better type safety.
interface AppData {
  expenses: any[];
  weeklyTarget: number;
  monthlyTarget: number;
}

const STORAGE_KEY = 'expenseTrackerData';

// Function to load data from localStorage
export const loadData = (): AppData => {
  try {
    const serializedData = window.localStorage.getItem(STORAGE_KEY);
    if (serializedData === null) {
      // Return default values if no data is found
      return { expenses: [], weeklyTarget: 500, monthlyTarget: 2000 };
    }
    const data = JSON.parse(serializedData);
    // Ensure all keys exist, providing defaults if they don't
    return {
      expenses: data.expenses || [],
      weeklyTarget: data.weeklyTarget || 500,
      monthlyTarget: data.monthlyTarget || 2000,
    };
  } catch (error) {
    console.error("Could not load data from localStorage", error);
    // Return default values in case of an error
    return { expenses: [], weeklyTarget: 500, monthlyTarget: 2000 };
  }
};

// Function to save data to localStorage
export const saveData = (data: AppData): void => {
  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error("Could not save data to localStorage", error);
  }
};
