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
exports.checkDuplicateReference = exports.getAdjustmentById = exports.getAllAdjustments = exports.createReturn = exports.cancelSale = exports.createSale = exports.getSaleByTicketNumber = exports.getSaleById = exports.getAllSales = void 0;
const SaleService_1 = require("../services/SaleService");
const TransactionAdjustmentService_1 = require("../services/TransactionAdjustmentService");
// Note: Most business logic has been moved to the service layer.
// The controller is responsible for request/response handling and basic validation.
const getAllSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sales = yield SaleService_1.saleService.getAllSales();
        res.json(sales);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error });
    }
});
exports.getAllSales = getAllSales;
const getSaleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid sale ID');
        }
        const sale = yield SaleService_1.saleService.getSaleById(id);
        if (sale) {
            res.json(sale);
        }
        else {
            res.status(404).send('Sale not found');
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sale', error });
    }
});
exports.getSaleById = getSaleById;
const getSaleByTicketNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticketNumber } = req.params;
        if (!ticketNumber) {
            return res.status(400).send('Invalid ticket number');
        }
        const sale = yield SaleService_1.saleService.getSaleByTicketNumber(ticketNumber);
        if (sale) {
            res.json(sale);
        }
        else {
            res.status(404).send('Sale not found');
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sale', error });
    }
});
exports.getSaleByTicketNumber = getSaleByTicketNumber;
const createSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { items, payments, totalUsd, totalBs, customerId, cashRegisterSessionId, discount, discountType, discountValue, pendingRecharges, pendingCashAdvances } = req.body;
        // Permitir ventas sin items si hay recargas o avances pendientes
        if ((!items || !Array.isArray(items) || items.length === 0) &&
            (!pendingRecharges || pendingRecharges.length === 0) &&
            (!pendingCashAdvances || pendingCashAdvances.length === 0)) {
            return res.status(400).send('Invalid sale data: items, recharges or cash advances are required.');
        }
        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return res.status(400).send('Invalid sale data: payments are required.');
        }
        if (cashRegisterSessionId === undefined) {
            return res.status(400).send('Invalid sale data: cashRegisterSessionId is required.');
        }
        const saleData = {
            items: items || [],
            payments,
            totalUsd,
            totalBs,
            customerId,
            cashRegisterSessionId,
            discount: discount || 0,
            discountType: discountType || null,
            discountValue: discountValue || 0,
            pendingRecharges: pendingRecharges || undefined,
            pendingCashAdvances: pendingCashAdvances || undefined,
        };
        const newSale = yield SaleService_1.saleService.createSale(saleData);
        res.status(201).json(newSale);
    }
    catch (error) {
        console.error('--- CREATE SALE ERROR ---', error); // Log the full error
        if (error instanceof Error) {
            if (error.message.includes('Insufficient stock')) {
                return res.status(400).json({ message: error.message });
            }
            // Send a more descriptive error message for other cases
            return res.status(400).json({ message: 'Error creating sale', error: error.message });
        }
        // Fallback for non-Error objects
        return res.status(400).json({ message: 'An unknown error occurred while creating the sale.' });
    }
});
exports.createSale = createSale;
const cancelSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid sale ID');
        }
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).send('Cancellation reason is required');
        }
        const cancelledSale = yield SaleService_1.saleService.cancelSale(id);
        if (cancelledSale) {
            yield TransactionAdjustmentService_1.transactionAdjustmentService.createAdjustment({
                saleId: id,
                type: 'cancellation',
                reason,
            });
            res.json(cancelledSale);
        }
        else {
            res.status(404).send('Sale not found or already cancelled');
        }
    }
    catch (error) {
        console.error('ERROR CANCELLING SALE:', error);
        if (error.message === 'Sale not found or already cancelled.') {
            return res.status(400).json({ message: 'Esta venta ya ha sido anulada o no existe.' });
        }
        res.status(500).json({ message: 'Error cancelling sale', error: error.message });
    }
});
exports.cancelSale = cancelSale;
// The other adjustment-related controller functions can remain as they are,
// as they primarily interact with the transactionAdjustmentService.
const createReturn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid sale ID');
        }
        const { reason, adjustedItems, amountRefunded } = req.body;
        if (!reason || !adjustedItems || !Array.isArray(adjustedItems)) {
            return res.status(400).send('Reason and adjusted items are required for return');
        }
        const adjustment = yield TransactionAdjustmentService_1.transactionAdjustmentService.createAdjustment({
            saleId: id,
            type: 'return',
            reason,
            adjustedItems,
            amountRefunded,
        });
        res.status(201).json(adjustment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating return', error });
    }
});
exports.createReturn = createReturn;
const getAllAdjustments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adjustments = yield TransactionAdjustmentService_1.transactionAdjustmentService.getAllAdjustments();
        res.json(adjustments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching adjustments', error });
    }
});
exports.getAllAdjustments = getAllAdjustments;
const getAdjustmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid adjustment ID');
        }
        const adjustment = yield TransactionAdjustmentService_1.transactionAdjustmentService.getAdjustmentById(id);
        if (adjustment) {
            res.json(adjustment);
        }
        else {
            res.status(404).send('Adjustment not found');
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching adjustment', error });
    }
});
exports.getAdjustmentById = getAdjustmentById;
/**
 * Check if a payment reference already exists for today
 * Used to prevent duplicate references for Pago Móvil and Transferencia
 */
const checkDuplicateReference = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reference, paymentMethods } = req.body;
        if (!reference || typeof reference !== 'string') {
            return res.status(400).json({ message: 'Reference is required' });
        }
        // Default to Pago Móvil and Transferencia if not specified
        const methods = paymentMethods || ['Pago Móvil', 'Transferencia'];
        const result = yield SaleService_1.saleService.checkDuplicateReference(reference, methods);
        res.json(result);
    }
    catch (error) {
        console.error('Error checking duplicate reference:', error);
        res.status(500).json({ message: 'Error checking reference', error });
    }
});
exports.checkDuplicateReference = checkDuplicateReference;
