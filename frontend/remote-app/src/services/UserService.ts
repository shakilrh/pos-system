export default class UserService {
  static async getUserDetails(token: string) {
    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/details', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.data.user; // Adjust based on actual API response structure
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }
}