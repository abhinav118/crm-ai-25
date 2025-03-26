// This is a compatibility file to maintain backward compatibility
// It re-exports BulkActionsTab as BulkActionsTable

import BulkActionsTab from './BulkActions/BulkActionsTab';

// Export the BulkActionsTab component as both named export (BulkActionsTable)
export { BulkActionsTab as BulkActionsTable };

// Export BulkActionsTab as default export
export default BulkActionsTab;
