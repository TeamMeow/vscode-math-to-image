import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-latex-in-readme" is now active!')

  let disposable = vscode.commands.registerCommand('vscode-latex-in-readme.render-selection', () => {
    vscode.window.showInformationMessage('Rendered equation!')
  })

  context.subscriptions.push(disposable)
}

export function deactivate() {}
