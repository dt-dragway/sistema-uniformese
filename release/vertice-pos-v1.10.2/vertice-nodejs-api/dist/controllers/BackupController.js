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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBackup = exports.downloadBackup = void 0;
const BackupService_1 = require("../services/BackupService");
const fs_1 = __importDefault(require("fs"));
const downloadBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filePath = yield BackupService_1.backupService.createBackup();
        res.download(filePath, (err) => {
            // Eliminar el archivo temporal después de la descarga
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            if (err) {
                console.error('Error during backup download:', err);
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.downloadBackup = downloadBackup;
const restoreBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo de respaldo.' });
        }
        const filePath = req.file.path;
        yield BackupService_1.backupService.restoreBackup(filePath);
        // Eliminar archivo subido después de restaurar
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        res.status(200).json({ message: 'Base de datos restaurada con éxito. La aplicación se reiniciará.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.restoreBackup = restoreBackup;
