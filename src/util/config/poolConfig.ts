import * as vscode from 'vscode';

const database = vscode.workspace.getConfiguration('codesync').get('database');

export const poolConfig = {
    "host": "127.0.0.1", 
    "user":"root", 
    "database": database
};