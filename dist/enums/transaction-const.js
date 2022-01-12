"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["NEW"] = "new";
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SETTLED"] = "settled";
    TransactionStatus["CANCELED"] = "canceled";
    TransactionStatus["ERROR"] = "error";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["REFUND"] = "refund";
    TransactionType["SALE"] = "sale";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
