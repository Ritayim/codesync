// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { updateScriptBySysId } from './util/scriptUtil';
import { parseXMLtoJSON, findKeyAndValue } from './util/xmlUtil';
import { SCRIPT, SYS_CLASS_NAME, SYS_ID } from './constants/fieldConstants';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('codesync.sync', () => {
		vscode.window.showInformationMessage("Codesync is activated!");
	}));
}

vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
	syncDocument(document);
});

async function syncDocument(document: vscode.TextDocument) {
	if (document.languageId !== 'xml' || document.isDirty) { return; }

	const xmlObject = parseXMLtoJSON(document.fileName);
	const sysIdKeyValue = findKeyAndValue(xmlObject, SYS_ID);
	const sysClassNameKeyValue = findKeyAndValue(xmlObject, SYS_CLASS_NAME);
	const scriptKeyValue = findKeyAndValue(xmlObject, SCRIPT);

	if (sysIdKeyValue === undefined || sysClassNameKeyValue === undefined || scriptKeyValue === undefined) {
		console.log(`${SYS_CLASS_NAME} or ${SYS_ID} or ${SCRIPT} is not defined in the xml`);

		return;
	}

	const updateResult = await updateScriptBySysId(sysClassNameKeyValue?.value, sysIdKeyValue?.value, scriptKeyValue?.value);

	if (updateResult) {
		vscode.window.showInformationMessage("Your code is synced to your instance.");
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
