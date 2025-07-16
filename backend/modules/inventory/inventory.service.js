
const Inventory = require('./inventory.model');
const User = require('../user/user.model');

const inventoryService = {
    /**
     * Adds a new inventory item.
     * @param {object} itemData - Data for the new inventory item.
     * @param {string} userId - ID of the user adding the item.
     * @returns {Promise<object>} The newly created inventory item.
     * @throws {Error} If item code already exists.
     */
    addItem: async (itemData, userId) => {
        const existingItem = await Inventory.findOne({
            itemCode: itemData.itemCode
        });
        if (existingItem) {
            throw new Error('Item code already exists');
        }

        const newItem = new Inventory({
            ...itemData,
            addedBy: userId
        });

        await newItem.save();
        return newItem;
    },

    /**
     * Retrieves a list of inventory items with filters and pagination.
     * @param {object} filters - Query filters and pagination options.
     * @returns {Promise<object>} Object containing inventory items and pagination info.
     */
    getInventoryList: async (filters) => {
        const {
            category,
            status,
            search,
            isLowStock,
            isExpired,
            page = 1,
            limit = 20,
            sortBy = 'itemName',
            sortOrder = 'asc'
        } = filters;

        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        // Convert boolean strings to actual booleans
        if (isLowStock !== undefined) query.isLowStock = (isLowStock === 'true');
        if (isExpired !== undefined) query.isExpired = (isExpired === 'true');


        if (search) {
            query.$or = [{
                itemName: {
                    $regex: search,
                    $options: 'i'
                }
            }, {
                itemCode: {
                    $regex: search,
                    $options: 'i'
                }
            }, {
                description: {
                    $regex: search,
                    $options: 'i'
                }
            }, {
                'supplier.name': {
                    $regex: search,
                    $options: 'i'
                }
            }, {
                'manufacturer.name': {
                    $regex: search,
                    $options: 'i'
                }
            }];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const inventory = await Inventory.find(query)
            .populate('addedBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Inventory.countDocuments(query);

        return {
            inventory,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Gets inventory summary statistics and alerts.
     * @param {number} expiringDaysThreshold - Number of days to consider an item expiring soon.
     * @returns {Promise<object>} Inventory summary data.
     */
    getInventorySummary: async (expiringDaysThreshold = 30) => {
        const summary = await Inventory.getInventorySummary();

        const lowStockItems = await Inventory.getLowStockItems();
        const expiringItems = await Inventory.getExpiringItems(expiringDaysThreshold);

        const totalItems = await Inventory.countDocuments();
        const totalValueAggregation = await Inventory.aggregate([{
            $group: {
                _id: null,
                total: {
                    $sum: '$totalValue'
                }
            }
        }]);
         const totalValue = (totalValueAggregation[0] && totalValueAggregation[0].total) ? totalValueAggregation[0].total : 0;

        return {
            summary,
            lowStockItemsCount: lowStockItems.length,
            expiringItemsCount: expiringItems.length,
            totalItems,
            totalValue,
            alerts: {
                lowStock: lowStockItems.length,
                expiring: expiringItems.length,
                critical: lowStockItems.filter(item => item.isCritical).length
            }
        };
    },

    /**
     * Gets a specific inventory item by ID.
     * @param {string} itemId - The ID of the inventory item.
     * @returns {Promise<object>} The inventory item.
     * @throws {Error} If item not found.
     */
    getItemById: async (itemId) => {
        const item = await Inventory.findById(itemId)
            .populate('addedBy', 'firstName lastName')
            .populate('lastUpdatedBy', 'firstName lastName');

        if (!item) {
            throw new Error('Inventory item not found');
        }
        return item;
    },

    /**
     * Updates an existing inventory item.
     * @param {string} itemId - The ID of the item to update.
     * @param {object} updateData - Data to update the item with.
     * @param {string} userId - ID of the user performing the update.
     * @returns {Promise<object>} The updated inventory item.
     * @throws {Error} If item not found or item code already exists.
     */
    updateItem: async (itemId, updateData, userId) => {
        const item = await Inventory.findById(itemId);

        if (!item) {
            throw new Error('Inventory item not found');
        }

        // Check if item code is being changed and if it already exists
        if (updateData.itemCode && updateData.itemCode !== item.itemCode) {
            const existingItem = await Inventory.findOne({
                itemCode: updateData.itemCode
            });
            if (existingItem) {
                throw new Error('Item code already exists');
            }
        }

        Object.assign(item, updateData);
        item.lastUpdatedBy = userId;

        await item.save();
        return item;
    },

    /**
     * Updates the stock of an inventory item.
     * @param {string} itemId - The ID of the item to update stock for.
     * @param {number} quantity - The quantity to add, subtract, or set.
     * @param {'add'|'subtract'|'set'} type - The type of stock operation.
     * @param {string} userId - ID of the user performing the update.
     * @returns {Promise<object>} The updated inventory item.
     * @throws {Error} If item not found or insufficient stock.
     */
    updateItemStock: async (itemId, quantity, type, userId) => {
        const item = await Inventory.findById(itemId);

        if (!item) {
            throw new Error('Inventory item not found');
        }

        await item.updateStock(quantity, type); // This method updates currentStock and calls item.save()
        item.lastUpdatedBy = userId;
        await item.save(); // Save again to update lastUpdatedBy

        return item;
    },

    /**
     * Deletes an inventory item.
     * @param {string} itemId - The ID of the item to delete.
     * @returns {Promise<void>}
     * @throws {Error} If item not found.
     */
    deleteItem: async (itemId) => {
        const item = await Inventory.findById(itemId);

        if (!item) {
            throw new Error('Inventory item not found');
        }

        await Inventory.findByIdAndDelete(itemId);
    },

    /**
     * Gets items currently in low stock.
     * @returns {Promise<object[]>} Array of low stock inventory items.
     */
    getLowStockAlerts: async () => {
        const lowStockItems = await Inventory.getLowStockItems();
        return {
            items: lowStockItems,
            count: lowStockItems.length
        };
    },

    /**
     * Gets items expiring soon.
     * @param {number} days - Number of days threshold for expiring items.
     * @returns {Promise<object[]>} Array of expiring inventory items.
     */
    getExpiringAlerts: async (days = 30) => {
        const expiringItems = await Inventory.getExpiringItems(days);
        return {
            items: expiringItems,
            count: expiringItems.length,
            daysThreshold: parseInt(days) // Ensure it's an integer
        };
    },

    /**
     * Performs a bulk update on multiple inventory items' stock.
     * @param {Array<object>} itemsToUpdate - Array of { id, quantity, type } objects.
     * @param {string} userId - ID of the user performing the bulk update.
     * @returns {Promise<object>} Summary of successful and failed updates.
     */
    bulkUpdateInventory: async (itemsToUpdate, userId) => {
        const results = [];

        for (const itemUpdate of itemsToUpdate) {
            try {
                const item = await Inventory.findById(itemUpdate.id);
                if (item) {
                    await item.updateStock(itemUpdate.quantity, itemUpdate.type);
                    item.lastUpdatedBy = userId;
                    await item.save(); // Save to persist lastUpdatedBy and derived fields
                    results.push({
                        id: itemUpdate.id,
                        success: true,
                        item
                    });
                } else {
                    results.push({
                        id: itemUpdate.id,
                        success: false,
                        error: 'Item not found'
                    });
                }
            } catch (error) {
                results.push({
                    id: itemUpdate.id,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return {
            message: `Bulk update completed. ${successCount} successful, ${failureCount} failed.`,
            results,
            summary: {
                total: itemsToUpdate.length,
                successful: successCount,
                failed: failureCount
            }
        };
    }
};

module.exports = inventoryService;