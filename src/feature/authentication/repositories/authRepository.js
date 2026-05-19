export class AuthRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async logout() {
    try {
      return await this.dataSource.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
}
