
const fs = require('fs');
const path = 'c:/repositorios/Challenge-Tecnosoftware/backend/src/database/migration/history/1771370037193-$npm_config_name.ts';
if (fs.existsSync(path)) {
  try {
    fs.unlinkSync(path);
    console.log('Deleted successfully');
  } catch (err) {
    console.error('Error deleting:', err);
    process.exit(1);
  }
} else {
  console.log('File not found');
}
