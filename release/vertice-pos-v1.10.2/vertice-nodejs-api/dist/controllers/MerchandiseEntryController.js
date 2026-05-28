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
exports.getMerchandiseEntryById = exports.getAllMerchandiseEntries = exports.createMerchandiseEntry = void 0;
const MerchandiseEntryService_1 = require("../services/MerchandiseEntryService");
const createMerchandiseEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newEntry = req.body;
        const entry = yield MerchandiseEntryService_1.merchandiseEntryService.createEntry(newEntry);
        if (entry) {
            res.status(201).json(entry);
        }
        else {
            res.status(400).send('Product not found or invalid data');
        }
    }
    catch (error) {
        res.status(500).send('Error creating merchandise entry');
    }
});
exports.createMerchandiseEntry = createMerchandiseEntry;
const getAllMerchandiseEntries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entries = yield MerchandiseEntryService_1.merchandiseEntryService.getAllEntries();
        res.json(entries);
    }
    catch (error) {
        res.status(500).send('Error fetching merchandise entries');
    }
});
exports.getAllMerchandiseEntries = getAllMerchandiseEntries;
const getMerchandiseEntryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid entry ID');
        }
        const entry = yield MerchandiseEntryService_1.merchandiseEntryService.getEntryById(id);
        if (entry) {
            res.json(entry);
        }
        else {
            res.status(404).send('Merchandise entry not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching merchandise entry');
    }
});
exports.getMerchandiseEntryById = getMerchandiseEntryById;
