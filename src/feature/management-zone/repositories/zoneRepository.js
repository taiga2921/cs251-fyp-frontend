export class ZoneRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async getAllZones() {
    try {
      return await this.dataSource.getAllZones();
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  }

  async getZoneById(zoneId) {
    try {
      return await this.dataSource.getZoneById(zoneId);
    } catch (error) {
      console.error('Error fetching zone:', error);
      throw error;
    }
  }

  async createZone(zoneData) {
    try {
      if (!zoneData.name || !zoneData.description) {
        throw new Error('Zone name is required');
      }
      return await this.dataSource.createZone(zoneData);
    } catch (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  }

  async updateZone(zoneId, zoneData) {
    try {
      if (!zoneData.name || !zoneData.description) {
        throw new Error('Zone name is required');
      }
      return await this.dataSource.updateZone(zoneId, zoneData);
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  }

  async deleteZone(zoneId) {
    try {
      return await this.dataSource.deleteZone(zoneId);
    } catch (error) {
      console.error('Error deleting zone:', error);
      throw error;
    }
  }

  filterZones(zones, searchText) {
    if (!searchText) return zones;

    const lowerSearch = searchText.toLowerCase();
    return zones.filter((zone) => {
      const name = zone.name || '';
      // const checkpoints_count = zone.checkpoints_count || '';

      // return zone.name.toLowerCase().includes(lowerSearch) || zone.checkpoints_count.toString().toLowerCase().includes(lowerSearch);
      return name.toLowerCase().includes(lowerSearch);
    });
  }

  paginateZones(zones, page, rowsPerPage) {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return zones.slice(start, end);
  }
}
