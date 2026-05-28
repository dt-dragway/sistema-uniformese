"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInternalWithdrawal = exports.createMerchandiseEntry = exports.getInventoryMovementsByProductId = exports.getAllInventoryMovements = void 0;
const InventoryService_1 = require("../services/InventoryService");
const getAllInventoryMovements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const movements = yield InventoryService_1.inventoryService.getAllInventoryMovements();
        res.json(movements);
    }
    catch (error) {
        console.error('Error fetching all inventory movements:', error);
        res.status(500).send('Error fetching all inventory movements');
    }
});
exports.getAllInventoryMovements = getAllInventoryMovements;
const getInventoryMovementsByProductId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) {
            return res.status(400).send('Invalid product ID');
        }
        const movements = yield InventoryService_1.inventoryService.getInventoryMovementsByProductId(productId);
        res.json(movements);
    }
    catch (error) {
        console.error(`Error fetching inventory movements for product ${req.params.productId}:`, error);
        res.status(500).send('Error fetching inventory movements for product');
    }
});
exports.getInventoryMovementsByProductId = getInventoryMovementsByProductId;
const createMerchandiseEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, quantity, cost, supplier } = req.body;
        if (!productId || !quantity || !cost) {
            return res.status(400).send('Missing required fields: productId, quantity, cost');
        }
        const entry = yield InventoryService_1.inventoryService.createMerchandiseEntry(productId, quantity, cost, supplier);
        res.status(201).json(entry);
    }
    catch (error) {
        console.error('Error creating merchandise entry:', error);
        res.status(500).send('Error creating merchandise entry');
    }
});
exports.createMerchandiseEntry = createMerchandiseEntry;
const createInternalWithdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, reason } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).send('Invalid items data');
        }
        const result = yield InventoryService_1.inventoryService.createInternalWithdrawal(items, reason || 'Consumo personal');
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error creating internal withdrawal:', error);
        res.status(500).send('Error creating internal withdrawal');
    }
});
exports.createInternalWithdrawal = createInternalWithdrawal;
