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
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPaymentMethodById = exports.getAllPaymentMethods = void 0;
const PaymentMethodService_1 = require("../services/PaymentMethodService");
const getAllPaymentMethods = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const methods = yield PaymentMethodService_1.paymentMethodService.getAllPaymentMethods();
        res.json(methods);
    }
    catch (error) {
        res.status(500).send('Error fetching payment methods');
    }
});
exports.getAllPaymentMethods = getAllPaymentMethods;
const getPaymentMethodById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const method = yield PaymentMethodService_1.paymentMethodService.getPaymentMethodById(id);
        if (method) {
            res.json(method);
        }
        else {
            res.status(404).send('Payment method not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching payment method');
    }
});
exports.getPaymentMethodById = getPaymentMethodById;
const createPaymentMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newMethod = req.body;
        const method = yield PaymentMethodService_1.paymentMethodService.createPaymentMethod(newMethod);
        res.status(201).json(method);
    }
    catch (error) {
        res.status(500).send('Error creating payment method');
    }
});
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const updatedFields = req.body;
        const method = yield PaymentMethodService_1.paymentMethodService.updatePaymentMethod(id, updatedFields);
        if (method) {
            res.json(method);
        }
        else {
            res.status(404).send('Payment method not found');
        }
    }
    catch (error) {
        res.status(500).send('Error updating payment method');
    }
});
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const deleted = yield PaymentMethodService_1.paymentMethodService.deletePaymentMethod(id);
        if (deleted) {
            res.status(204).send(); // No Content
        }
        else {
            res.status(404).send('Payment method not found');
        }
    }
    catch (error) {
        res.status(500).send('Error deleting payment method');
    }
});
exports.deletePaymentMethod = deletePaymentMethod;
