const SQL = require('sql-template-strings')
const db = require('../Configurations/ConnectionDB');


const express = require('express');
const fileUpload = require('express-fileupload');
const router = express.Router();
const query = require('../Queries/Document.query');

const util = require('util');

const path = require('path');
const utils = require('nodemon/lib/utils');

//const fnDocument = require('../Functions/Document.function');

const fs = require('fs');
const { resolve } = require('path');

const http = require('http');

async function getDocuments() {
    var sql = "SELECT * FROM Document";
    var response = await db.query(sql);
    return { estado: true, message: "", data: response }
}

async function getDocumentsType(docType) {
    var sql = 'SELECT * FROM Document WHERE DocType = "' + docType + '"';
    var response = await db.query(sql);
    return { estado: true, message: "", data: response }
}

async function getDocument(docName, docType) {

    var sql = 'SELECT * FROM Document WHERE DocName = "' + docName + '" AND DocType = "' + docType + '"';
    let response = await db.query(sql);
    console.log('response del GetDocument:>> ', response);
    return { estado: true, message: "", data: response };
}

async function insertDocument(docName, docType, docPath) {
    var response = [];
    const sql = 'INSERT INTO Document (DocName, DocType, LatestModDate, DocPath) VALUES (?,?, current_date(),? );'
    var param = [docName, docType, docPath];
    response = db.query(sql, param);
    return { estado: true, message: "", data: response }
}

async function postDocument(req, docType, myPath) {
    var folder = "";
    switch (docType) {
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
    const file = req.files.file;
    const fileName = file.name;
    const size = file.data.length;
    const extension = path.extname(fileName);
    const URL = myPath + folder;


    let myDoc = await getDocument(fileName, docType);
    if (myDoc.data == null || myDoc.data.length <= 0) {
        try {
            if (size > 1000000000) throw new Error("File must be less than 1GB!");

            await util.promisify(file.mv)(URL + '/' + fileName);
            var miRes = await insertDocument(fileName, docType, folder);
            return { estado: true, message: "Document posted successfully", data: miRes.data }
        } catch (err) {
            return { estado: false, message: String(err), data: null }
        }
    } else {
        return { estado: false, message: "The file already exists", data: null }
    }

}

async function updateDocName(oldName, newName, docType) {
    let myDoc = await getDocument(oldName, docType);
    console.log('myDoc desde updateDocName:>> ', myDoc);
    if (myDoc.data != null && myDoc.data.length > 0) {
        try {

            if (fs.existsSync(myDoc.data[0].DocPath + "/" + oldName)) {

                const sql = 'UPDATE Document SET DocName = ? WHERE DocName = ? AND DocType = ?';
                var param = [newName, oldName, docType];
                let response = await db.query(sql, param);

                let newDate = await updateLatestModDate(newName, docType);
                if (!newDate.estado) throw new Error("Unable to update the Latest Modified Date field");

                fs.renameSync(myDoc.data[0].DocPath + "/" + oldName, myDoc.data[0].DocPath + "/" + newName);
                return { estado: true, message: "Document name updated successfully", data: response }
            } else {
                console.log("Unable to Rename Document in Server");
                return { estado: true, message: "Unable to Rename Document in Server", data: null }
            }


        } catch (err) {
            return { estado: false, message: String(err), data: null }
        }
    } else {
        return { estado: false, message: "The file does not exist", data: null }
    }
}
async function deleteDocument(docName, docType) {

    var sql = 'DELETE FROM Document WHERE DocName = "' + docName + '" AND DocType = "' + docType + '"';
    let response = await db.query(sql);
    console.log('response del DeleteDocument:>> ', response);
    return { estado: true, message: "", data: response };
}

async function deleteDocumentComplete(docName, docType) {

    let mydoc = await getDocument(docName, docType);
    if (mydoc.data != null && mydoc.data.length > 0 && fs.existsSync(mydoc.data[0].DocPath + "/" + docName)) {
        let eliminated = await deleteDocument(docName, docType);
        if (eliminated.data.affectedRows > 0) {
            fs.unlinkSync(mydoc.data[0].DocPath + "/" + docName);
            console.log("Dodument Deleted Successfully!");
            return { estado: true, message: "Document deleted completely successfully!", data: eliminated };

        } else {
            console.log("Unable to Delete Document, it does not exist");
            return { estado: false, message: "Document to delete does not exist", data: null };
        }
    } else {
        console.log("Unable to Delete Document, it does not exist, unable to retrieve file from DB");
        return { estado: false, message: "Document to delete does not exist , unable to retrieve file from DB", data: null };
    }

}

async function updateDocument(req, docName, docType) {
    let myDoc = await getDocument(docName, docType);
    if (myDoc.data != null && myDoc.data.length > 0 && fs.existsSync(myDoc.data[0].DocPath + "/" + docName)) {
        //borramos del FS
        fs.unlinkSync(myDoc.data[0].DocPath + "/" + docName);

        //ponemos otro en su lugar en el FS
        const extensionList = docName.split('.');
        const extensionOriginal = extensionList[extensionList.length - 1];

        const file = req.files.file;
        const fileName = file.name;
        const size = file.data.length;
        const extension = path.extname(fileName);
        const URL = myDoc.data[0].DocPath;

        try {
            if (size > 1000000000) throw new Error("File must be less than 1GB!");
            if (extension != "." + extensionOriginal) throw new Error("The updated file extension does not match original extension");
            await util.promisify(file.mv)(URL + '/' + docName);
            let newDate = await updateLatestModDate(docName, docType);
            if (!newDate.estado) throw new Error("Unable to update the Latest Modified Date field");
            return { estado: true, message: "Document updated successfully", data: null }
        } catch (err) {
            return { estado: false, message: String(err), data: null }
        }
    } else {
        return { estado: false, message: "Unable to find document to update", data: null };
    }
}

async function updateViewCount(docName, docType) {

    try {
        const sql = 'UPDATE Document SET ViewCount = (ViewCount + 1) WHERE DocName = ? AND DocType = ?';
        var param = [docName, docType];
        let response = await db.query(sql, param);
        if (response.affectedRows <= 0) {
            throw new Error("No rows were affected by the update in DB, document not found");
        }
        return { estado: true, message: "Update ViewCount increased by 1 view", data: response };
    } catch (err) {
        return { estado: false, message: String(err), data: null };
    }


}

async function updateDownloadCount(docName, docType) {

    try {
        const sql = 'UPDATE Document SET DownloadCount = (DownloadCount + 1) WHERE DocName = ? AND DocType = ?';
        var param = [docName, docType];
        let response = await db.query(sql, param);
        if (response.affectedRows <= 0) {
            throw new Error("No rows were affected by the update in DB, document not found");
        }

        return { estado: true, message: "Update DownloadCount increased by 1 download", data: response };

    } catch (err) {
        return { estado: false, message: String(err), data: null };
    }

}

async function updateLatestModDate(docName, docType) {

    try {
        const sql = 'UPDATE Document SET LatestModDate = current_date() WHERE DocName = ? AND DocType = ?';
        var param = [docName, docType];
        let response = await db.query(sql, param);
        if (response.affectedRows <= 0) {
            throw new Error("No rows were affected by the update in DB, document not found");
        }
        return { estado: true, message: "Updated LatestModDate to current date", data: response };

    } catch (err) {
        return { estado: false, message: String(err), data: null };
    }

}
module.exports = {
    getDocuments,
    getDocument,
    insertDocument,
    postDocument,
    updateDocName,
    deleteDocument,
    deleteDocumentComplete,
    updateDocument,
    updateViewCount,
    updateDownloadCount,
    updateLatestModDate,
    getDocumentsType
};