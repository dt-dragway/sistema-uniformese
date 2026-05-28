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
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const CustomerService_1 = require("../services/CustomerService");
const getAllCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customers = yield CustomerService_1.customerService.getAllCustomers();
        res.json(customers);
    }
    catch (error) {
        res.status(500).send('Error fetching customers');
    }
});
exports.getAllCustomers = getAllCustomers;
const getCustomerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const customer = yield CustomerService_1.customerService.getCustomerById(id);
        if (customer) {
            res.json(customer);
        }
        else {
            res.status(404).send('Customer not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching customer');
    }
});
exports.getCustomerById = getCustomerById;
const createCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { cedula, name, email, phone, address, creditLimit } = req.body;
        if (!cedula || !name || creditLimit === undefined) {
            return res.status(400).send('Cedula, name, and creditLimit are required.');
        }
        const newCustomer = {
            cedula: cedula.toUpperCase(),
            name: name.toUpperCase(),
            email,
            phone: phone === null || phone === void 0 ? void 0 : phone.toUpperCase(),
            address: address === null || address === void 0 ? void 0 : address.toUpperCase(),
            creditLimit
        };
        const customer = yield CustomerService_1.customerService.createCustomer(newCustomer);
        res.status(201).json(customer);
    }
    catch (error) {
        const prismaError = error;
        if (prismaError.code === 'P2002' && ((_b = (_a = prismaError.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('cedula'))) {
            return res.status(409).json({ message: 'A customer with this cedula already exists.' });
        }
        res.status(500).send('Error creating customer');
    }
});
exports.createCustomer = createCustomer;
const updateCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const updatedFields = req.body;
        if (updatedFields.name) {
            updatedFields.name = updatedFields.name.toUpperCase();
        }
        if (updatedFields.cedula) {
            updatedFields.cedula = updatedFields.cedula.toUpperCase();
        }
        if (updatedFields.phone) {
            updatedFields.phone = updatedFields.phone.toUpperCase();
        }
        if (updatedFields.address) {
            updatedFields.address = updatedFields.address.toUpperCase();
        }
        const customer = yield CustomerService_1.customerService.updateCustomer(id, updatedFields);
        if (customer) {
            res.json(customer);
        }
        else {
            res.status(404).send('Customer not found');
        }
    }
    catch (error) {
        const prismaError = error;
        if (prismaError.code === 'P2002' && ((_b = (_a = prismaError.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('cedula'))) {
            return res.status(409).json({ message: 'A customer with this cedula already exists.' });
        }
        res.status(500).send('Error updating customer');
    }
});
exports.updateCustomer = updateCustomer;
const deleteCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }
        const deleted = yield CustomerService_1.customerService.deleteCustomer(id);
        if (deleted) {
            res.status(204).send(); // No Content
        }
        else {
            res.status(404).send('Customer not found');
        }
    }
    catch (error) {
        console.error('Error deleting customer:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({
                message: 'No se puede eliminar el cliente porque tiene facturas o abonos registrados. Considere anular su historial primero.'
            });
        }
        res.status(500).json({ message: 'Error al intentar eliminar el cliente' });
    }
});
exports.deleteCustomer = deleteCustomer;
