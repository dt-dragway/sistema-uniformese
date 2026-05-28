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
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const SupplierService_1 = require("../services/SupplierService");
const getAllSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suppliers = yield SupplierService_1.supplierService.getAllSuppliers();
        res.json(suppliers);
    }
    catch (error) {
        res.status(500).send('Error fetching suppliers');
    }
});
exports.getAllSuppliers = getAllSuppliers;
const getSupplierById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid supplier ID');
        }
        const supplier = yield SupplierService_1.supplierService.getSupplierById(id);
        if (supplier) {
            res.json(supplier);
        }
        else {
            res.status(404).send('Supplier not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching supplier');
    }
});
exports.getSupplierById = getSupplierById;
const createSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newSupplier = req.body;
        const supplier = yield SupplierService_1.supplierService.createSupplier(newSupplier);
        res.status(201).json(supplier);
    }
    catch (error) {
        res.status(500).send('Error creating supplier');
    }
});
exports.createSupplier = createSupplier;
const updateSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid supplier ID');
        }
        const updatedFields = req.body;
        const supplier = yield SupplierService_1.supplierService.updateSupplier(id, updatedFields);
        if (supplier) {
            res.json(supplier);
        }
        else {
            res.status(404).send('Supplier not found');
        }
    }
    catch (error) {
        res.status(500).send('Error updating supplier');
    }
});
exports.updateSupplier = updateSupplier;
const deleteSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid supplier ID');
        }
        const deleted = yield SupplierService_1.supplierService.deleteSupplier(id);
        if (deleted) {
            res.status(204).send(); // No Content
        }
        else {
            res.status(404).send('Supplier not found');
        }
    }
    catch (error) {
        res.status(500).send('Error deleting supplier');
    }
});
exports.deleteSupplier = deleteSupplier;
