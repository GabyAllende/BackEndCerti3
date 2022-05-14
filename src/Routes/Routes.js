const express = require('express');
const fileUpload = require('express-fileupload');
const router = express.Router();
const query = require('../Queries/Document.query');
const mysqlConnection = require('../Configurations/ConnectionDB');
const util = require('util');

const path = require('path');
const utils = require('nodemon/lib/utils');

const fs = require('fs');

router.get("/getDocuments", async function(_req, res) {
    try {
        mysqlConnection.query(query.getDocuments, function(error, results, _fields) {
            if (error) throw error;
            if (results == null) {
                console.log("Error retrieving data");
                res.status(400).json({ estado: false, data: false });
            } else {
                console.log("Data Retrieved Successfully");
                res.status(200).json({ estado: true, data: results });
            }
        });
    } catch (error) {
        res.status(409).send(String(error));
    }
});

router.post("/postDocument/:doctype", async function(req, res) {
    var doctype = req.params.doctype;
    var folder = "";
    switch (doctype) {
        case "LF":
            folder = "LegalFiles";
            break;
        case "CF":
            folder = "ContractFiles";
            break;
        case "PF":
            folder = "PublicFiles";
            break;
        default:
            folder = "PublicFiles";
    }
    try {
        const file = req.files.file;
        const fileName = file.name;
        const size = file.data.length;
        const extension = path.extname(fileName);
        const allowedExtensions = /png|jpg|jpeg|gif|docx|pdf/;
        const URL = '/var/www/html/' + folder;
        //const URL = 'C:/Users/Equipo/Documents/UPB/Semestre 7/CertificacionIII/' + folder;

        //VERIFICAMOS QUE NO EXISTA YA ESE FILE
        var getDoc = 'SELECT * FROM Document WHERE DocName = "' + fileName + '" AND DocType = "' + doctype + '"';
        mysqlConnection.query(getDoc, function(error, results, _fields) {
            if (error) throw error;
            if (results == null || results.length <= 0) {
                //AHORA SI CREAMOS EL FILE EN LA BD Y EN EL FS
                if (!allowedExtensions.test(extension)) throw new Error("Unsupported extension!");
                if (size > 1000000000) throw new Error("File must be less than 1GB!");
                util.promisify(file.mv)(URL + '/' + fileName); //AQUI ANTES HABIA UN AWAIT

                const insertDoc = 'INSERT INTO Document (DocName, DocType, LatestModDate, DocPath) VALUES ("' + fileName + '","' + doctype + '", current_date(),"' + URL + '" );'
                mysqlConnection.query(insertDoc, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                })
                res.status(200).json({
                    message: "File Uploaded Successfully",
                    fileName: fileName,
                    url: URL
                });
            } else {
                console.log("The file to Upload already exists");
                console.log(results);
                res.status(400).json({ estado: false, data: false });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: String(err)
        });
    }

});


// {
//     type:"PD",
//     oldName:"MyDoc1.pdf",
//     newName:"NewDoc1.pdf"
// }
router.put("/updateDocName", async function(req, res) {
    try {
        var updateDoc = 'UPDATE Document SET DocName = "' + req.body.newName + '" WHERE DocName = "' + req.body.oldName + '" AND DocType = "' + req.body.type + '"';
        var getDoc = 'SELECT * FROM Document WHERE DocName = "' + req.body.oldName + '" AND DocType = "' + req.body.type + '"';
        console.log('getDoc :>> ', getDoc);
        mysqlConnection.query(getDoc, function(error, results, _fields) {
            if (error) throw error;
            if (results == null) {
                console.log("Error retrieving data");
                res.status(400).json({ estado: false, data: false });
            } else if (results.length <= 0) {
                console.log("Unable to find the Document to Update");
                res.status(400).json({ estado: false, data: false });
            } else {
                console.log("Data Retrieved Successfully");
                console.log(results);

                mysqlConnection.query(updateDoc, function(updErr, updRes, _updFields) {
                    if (updErr) throw updErr;
                    else {
                        console.log('updRes :>> ', updRes);
                        console.log(results[0].DocPath + "/" + req.body.oldName);
                        if (fs.existsSync(results[0].DocPath + "/" + req.body.oldName)) {
                            fs.renameSync(results[0].DocPath + "/" + req.body.oldName, results[0].DocPath + "/" + req.body.newName);
                            res.status(200).json({ estado: true, data: results });
                        } else {
                            console.log("Unable to Rename Document in Server");
                            res.status(400).json({ estado: false, data: false });
                        }
                    }
                });

            }
        });
    } catch (error) {
        res.status(409).send(String(error));
    }
});

// {
//     type:"PD",
//     docName:"MyDoc1.pdf",
//     path: "/jnjoon/mijpkp"
// }
router.delete("/deleteDocument", async function(req, res) {
    try {
        var deleteDoc = 'DELETE FROM Document WHERE DocName = "' + req.body.docName + '" AND DocType = "' + req.body.type + '"';;
        mysqlConnection.query(deleteDoc, function(error, results, _fields) {
            if (error) throw error;
            if (results == null) {
                console.log("Error deleting Document");
                res.status(400).json({ estado: false, data: false });
            } else if (results.length <= 0) {
                console.log("Unable to find the Document to Delete");
                res.status(400).json({ estado: false, data: false });
            } else {

                console.log(req.body.path + "/" + req.body.docName);
                if (fs.existsSync(req.body.path + "/" + req.body.docName)) {
                    fs.unlinkSync(req.body.path + "/" + req.body.docName);
                    console.log("Dodument Deleted Successfully!");
                    res.status(200).json({ estado: true, data: results });
                } else {
                    console.log("Unable to Delete Document, it does not exist");
                    res.status(400).json({ estado: false, data: false });
                }
            }
        });
    } catch (error) {
        res.status(409).send(String(error));
    }
});
// {
//     type:"PD",
//     docName:"MyDoc1.pdf",
//     path: "/jnjoon/mijpkp"
// }
router.put("/updateDocument", async function(req, res) {
    try {
        //var updateDoc = 'UPDATE Document SET DocName = "' + req.body.newName + '" WHERE DocName = "' + req.body.oldName + '" AND DocType = "' + req.body.type + '"';
        var getDoc = 'SELECT * FROM Document WHERE DocName = "' + req.body.oldName + '" AND DocType = "' + req.body.type + '"';
        console.log('getDoc :>> ', getDoc);
        mysqlConnection.query(getDoc, function(error, results, _fields) {
            if (error) throw error;
            if (results == null) {
                console.log("Error retrieving data");
                res.status(400).json({ estado: false, data: false });
            } else if (results.length <= 0) {
                console.log("Unable to find the Document to Update");
                res.status(400).json({ estado: false, data: false });
            } else {
                console.log("Data Retrieved Successfully");
                console.log(results);

                console.log(results[0].DocPath + "/" + req.body.oldName);
                if (fs.existsSync(results[0].DocPath + "/" + req.body.oldName)) {
                    fs.renameSync(results[0].DocPath + "/" + req.body.oldName, results[0].DocPath + "/" + req.body.newName);
                    res.status(200).json({ estado: true, data: results });
                } else {
                    console.log("Unable to Rename Document in Server");
                    res.status(400).json({ estado: false, data: false });
                }

            }
        });
    } catch (error) {
        res.status(409).send(String(error));
    }
});


module.exports = router;