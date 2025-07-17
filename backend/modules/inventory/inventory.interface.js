
/**
 * @typedef {object} InventoryItem
 * @property {string} _id
 * @property {string} itemName
 * @property {string} itemCode
 * @property {'medications'|'equipment'|'supplies'|'devices'|'consumables'|'surgical'|'laboratory'|'emergency'|'other'} category
 * @property {string} [subcategory]
 * @property {string} [description]
 * @property {number} quantity
 * @property {'pieces'|'boxes'|'bottles'|'tubes'|'packs'|'units'|'sets'|'kits'|'meters'|'liters'|'grams'|'milliliters'} unit
 * @property {number} minimumStock
 * @property {number} [maximumStock]
 * @property {number} currentStock
 * @property {number} unitPrice
 * @property {number} [totalValue]
 * @property {object} [supplier]
 * @property {string} [supplier.name]
 * @property {string} [supplier.contactPerson]
 * @property {string} [supplier.email]
 * @property {string} [supplier.phone]
 * @property {string} [supplier.address]
 * @property {object} [manufacturer]
 * @property {string} [manufacturer.name]
 * @property {string} [manufacturer.country]
 * @property {string} [manufacturer.contactInfo]
 * @property {Date} [expiryDate]
 * @property {string} [batchNumber]
 * @property {object} [location]
 * @property {string} [location.building]
 * @property {string} [location.floor]
 * @property {string} [location.room]
 * @property {string} [location.shelf]
 * @property {string} [location.bin]
 * @property {'active'|'inactive'|'discontinued'|'recalled'} [status]
 * @property {boolean} [isCritical]
 * @property {boolean} [isExpired]
 * @property {boolean} [isLowStock]
 * @property {string} addedBy - ObjectId of the user who added the item
 * @property {string} [lastUpdatedBy] - ObjectId of the user who last updated the item
 * @property {string} [notes]
 * @property {string[]} [tags]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} [stockStatus] - Virtual property: 'out_of_stock'|'low_stock'|'overstocked'|'normal'
 * @property {number} [daysUntilExpiry] - Virtual property: days remaining until expiry
 */

/**
 * @typedef {object} AddInventoryItemPayload
 * @property {string} itemName
 * @property {string} itemCode
 * @property {'medications'|'equipment'|'supplies'|'devices'|'consumables'|'surgical'|'laboratory'|'emergency'|'other'} category
 * @property {number} quantity
 * @property {'pieces'|'boxes'|'bottles'|'tubes'|'packs'|'units'|'sets'|'kits'|'meters'|'liters'|'grams'|'milliliters'} unit
 * @property {number} minimumStock
 * @property {number} unitPrice
 * @property {number} currentStock
 * @property {string} [subcategory]
 * @property {string} [description]
 * @property {object} [supplier]
 * @property {object} [manufacturer]
 * @property {string} [expiryDate] - ISO 8601 date string
 * @property {string} [batchNumber]
 * @property {object} [location]
 * @property {string} [status]
 * @property {boolean} [isCritical]
 * @property {string} [notes]
 * @property {string[]} [tags]
 */

/**
 * @typedef {object} UpdateInventoryItemPayload
 * @property {string} [itemName]
 * @property {string} [itemCode]
 * @property {string} [category]
 * @property {string} [subcategory]
 * @property {string} [description]
 * @property {number} [quantity]
 * @property {string} [unit]
 * @property {number} [minimumStock]
 * @property {number} [maximumStock]
 * @property {number} [currentStock]
 * @property {number} [unitPrice]
 * @property {object} [supplier]
 * @property {object} [manufacturer]
 * @property {string} [expiryDate] - ISO 8601 date string
 * @property {string} [batchNumber]
 * @property {object} [location]
 * @property {string} [status]
 * @property {boolean} [isCritical]
 * @property {string} [notes]
 * @property {string[]} [tags]
 */


/**
 * @typedef {object} UpdateStockPayload
 * @property {number} quantity
 * @property {'add'|'subtract'|'set'} type
 * @property {string} [notes]
 */

/**
 * @typedef {object} BulkUpdateItem
 * @property {string} id - The _id of the inventory item
 * @property {number} quantity
 * @property {'add'|'subtract'|'set'} type
 */

/**
 * @typedef {object} InventoryListFilters
 * @property {string} [category]
 * @property {string} [status]
 * @property {string} [search]
 * @property {string} [isLowStock] - 'true' or 'false'
 * @property {string} [isExpired] - 'true' or 'false'
 * @property {number} [page=1]
 * @property {number} [limit=20]
 * @property {string} [sortBy='itemName']
 * @property {string} [sortOrder='asc']
 */

/**
 * @typedef {object} InventorySummaryByCategory
 * @property {string} _id - Category name
 * @property {number} totalItems
 * @property {number} totalQuantity
 * @property {number} totalValue
 * @property {number} lowStockItems
 * @property {number} expiredItems
 */

/**
 * @typedef {object} PaginationResult
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalItems
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

// This file primarily serves as documentation for the data structures.
// No executable code is typically exported from an interface file in JavaScript.