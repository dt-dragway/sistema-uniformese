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
exports.getMostSoldProducts = exports.getProductByBarcode = exports.getLowStockProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const ProductService_1 = require("../services/ProductService");
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield ProductService_1.productService.getAllProducts();
        res.json(products);
    }
    catch (error) {
        res.status(500).send('Error fetching products');
    }
});
exports.getAllProducts = getAllProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid product ID');
        }
        const product = yield ProductService_1.productService.getProductById(id);
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).send('Product not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching product');
    }
});
exports.getProductById = getProductById;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newProduct = req.body;
        const product = yield ProductService_1.productService.createProduct(newProduct);
        res.status(201).json(product);
    }
    catch (error) {
        res.status(500).send('Error creating product');
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send('Invalid product ID');
        }
        const updatedFields = req.body;
        const product = yield ProductService_1.productService.updateProduct(id, updatedFields);
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).send('Product not found');
        }
    }
    catch (error) {
        res.status(500).send('Error updating product');
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de producto inválido' });
        }
        const result = yield ProductService_1.productService.deleteProduct(id);
        if (result.success) {
            res.status(204).send(); // No Content
        }
        else {
            res.status(400).json({ message: result.error || 'No se pudo eliminar el producto' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
});
exports.deleteProduct = deleteProduct;
const getLowStockProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield ProductService_1.productService.getLowStockProducts();
        res.json(products);
    }
    catch (error) {
        res.status(500).send('Error fetching low stock products');
    }
});
exports.getLowStockProducts = getLowStockProducts;
const getProductByBarcode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { barCode } = req.params;
        const product = yield ProductService_1.productService.getProductByBarcode(barCode);
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).send('Product not found');
        }
    }
    catch (error) {
        res.status(500).send('Error fetching product by barcode');
    }
});
exports.getProductByBarcode = getProductByBarcode;
const getMostSoldProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield ProductService_1.productService.getMostSoldProducts();
        res.json(products);
    }
    catch (error) {
        res.status(500).send('Error fetching most sold products');
    }
});
exports.getMostSoldProducts = getMostSoldProducts;
