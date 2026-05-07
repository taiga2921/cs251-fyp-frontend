export class UserRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async getAllUsers() {
    try {
      return await this.dataSource.getAllUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      return await this.dataSource.getUserById(userId);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      if (!userData.name || !userData.email || !userData.phone || !userData.address || !userData.role) {
        throw new Error('Name, email, phone number, home address, and role are required');
      }
      return await this.dataSource.createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      if (!userData.name || !userData.email || !userData.phone || !userData.address || !userData.role) {
        throw new Error('Name, email, phone number, home address, and role are required');
      }
      return await this.dataSource.updateUser(userId, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      return await this.dataSource.deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  filterUsers(users, searchText) {
    if (!searchText) return users;

    const lowerSearch = searchText.toLowerCase();
    return users.filter((user) => {
      const name = user.name || '';
      const email = user.email || '';
      const phone = user.phone || '';

      return name.toLowerCase().includes(lowerSearch) || email.toLowerCase().includes(lowerSearch) || phone.includes(searchText);
    });
  }

  paginateUsers(users, page, rowsPerPage) {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return users.slice(start, end);
  }
}
