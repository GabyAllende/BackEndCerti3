const SQL = require('sql-template-strings')
const db = require('../Configurations/ConnectionDB');

const express = require('express');
const fileUpload = require('express-fileupload');
const router = express.Router();
const query = require('../Queries/Document.query');

const util = require('util');

const path = require('path');
const utils = require('nodemon/lib/utils');

const fnDocument = require('../Functions/Document.function');

const fs = require('fs');

router.get("/getDocuments", async function(_req, res) {
    var resultados = [];
    resultados = await fnDocument.getDocuments();
    res.send(resultados);
});
router.get("/", async function(_req, res) {
    res.status(200).json({ msg: "se esta intentando..." });
});
router.get("/getDocumentsType/:docType", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.getDocumentsType(req.params.docType);
    res.send(resultados);
});
// {
//     "docName":"myFile",
//     "docType":"PF"
// }
router.get("/getDocument", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.getDocument(req.body.docName, req.body.docType);
    res.send(resultados);
});
// {
//     "docName":"myFile",
//     "docType":"PF",
//     "docPath": "C:/Documents"
// }
router.post("/insertDocument", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.insertDocument(req.body.docName, req.body.docType, req.body.docPath);
    res.send(resultados);
});

router.post("/postDocument/:doctype", async function(req, res) {
    var resultados = [];
    const myPath = '/home/ec2-user/';
    //const myPath = 'C:/Users/Equipo/Documents/UPB/Semestre 7/CertificacionIII/';
    resultados = await fnDocument.postDocument(req, req.params.doctype, myPath);
    res.send(resultados);
});
// {
//     docType:"PD",
//     oldName:"MyDoc1.pdf",
//     newName:"NewDoc1.pdf"
// }
router.put("/updateDocName", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.updateDocName(req.body.oldName, req.body.newName, req.body.docType);
    res.send(resultados);
});

// {
//     "docName":"myFile",
//     "docType":"PF"
// }
router.delete("/deleteDocument", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.deleteDocument(req.body.docName, req.body.docType);
    res.send(resultados);
});

// {
//     "docName":"myFile",
//     "docType":"PF"
// }
router.delete("/deleteDocumentComplete", async function(req, res) {
    var resultados = [];
    resultados = await fnDocument.deleteDocumentComplete(req.body.docName, req.body.docType);
    res.send(resultados);
});
// {
//     "docName":"myFile",
//     "docType":"PF"
// }
router.put("/updateDocument", async function(req, res) {
    var resultados = [];
    console.log('req.body.docName, req.body.docType :>> ', req.body.docName + "," + req.body.docType);
    resultados = await fnDocument.updateDocument(req, req.body.docName, req.body.docType);
    res.send(resultados);
});
// {
//     "docName":"myFile",
//     "docPath":"/Equipo/Documents/UPB/Semestre 7/CertificacionIII/"
// }
router.get("/downloadDocument", async function(req, res) {
    const docName = req.query.docName;
    const docPath = req.query.docPath;
    const docType = req.query.docType;
    const URL = docPath + "/" + docName;
    await fnDocument.updateViewCount(docName, docType);
    await fnDocument.updateDownloadCount(docName, docType);
    res.download(URL, docName);
});

router.put("/updateViewCount", async function(req, res) {
    const docName = req.body.docName;
    const docType = req.body.docType;
    var resultados = [];
    resultados = await fnDocument.updateViewCount(docName, docType)
    res.send(resultados);
});

router.put("/updateDownloadCount", async function(req, res) {
    const docName = req.body.docName;
    const docType = req.body.docType;
    var resultados = [];
    resultados = await fnDocument.updateDownloadCount(docName, docType)
    res.send(resultados);
});

router.put("/updateLatestModDate", async function(req, res) {
    const docName = req.body.docName;
    const docType = req.body.docType;
    var resultados = [];
    resultados = await fnDocument.updateLatestModDate(docName, docType)
    res.send(resultados);
});
module.exports = router;