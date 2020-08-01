import * as vscode from 'vscode'

// VS Code active editor for current session
const editor = vscode.window.activeTextEditor

/**
 * Encode URL and return rendered <img> tag based on selected equation
 * @param equation selected inline or multiline equation
 */
function renderEquation(equation: string) {
  const renderAPIUrl = 'https://render.githubusercontent.com/render/math?math='
  const encodedMath = encodeURIComponent(equation)

  return `<img src="${renderAPIUrl}${encodedMath}">`
}

export function activate(context: vscode.ExtensionContext) {
  // console.log('Congratulations, your extension "vscode-latex-in-readme" is now active!')

  let disposable = vscode.commands.registerCommand('vscode-latex-in-readme.render-selection', () => {
    // Get selection text
    const selection = editor?.document.getText(editor.selection)
    const selectionStart = editor?.selection.start
    const selectionEnd = editor?.selection.end

    // const inline = selectionStart?.line === selectionEnd?.line ? true : false
    // console.log(selection, inline)

    if (selection === undefined || selectionStart === undefined || selectionEnd === undefined) {
      vscode.window.showErrorMessage('❗ Nothing selected!')
    } else {
      const inlineMath = /^\$[\s\S]*[\S]+[\s\S]*\$$/
      const displayMath = /^\$\$[\s\S]*[\S]+[\s\S]*\$\$$/

      // Enter rendered <img> into editor (and commenting out original equation)
      if (displayMath.test(selection)) {
        // Remove leading $$ and trailing $$
        const equation = selection.split('\n').slice(1, -1).join('\n')
        const renderedImage = renderEquation(equation)

        editor?.edit(editBuilder => {
          editBuilder.insert(selectionStart, '<!-- ')
          editBuilder.insert(selectionEnd, ` -->\n\n<div align="center">${renderedImage}</div>`)
        })
        vscode.window.showInformationMessage(`📐 Rendered equation: ${selection}!`)
      } else if (inlineMath.test(selection)) {
        // Remove leading $ and trailing $
        const equation = selection.slice(1, -1).trim()
        const renderedImage = renderEquation(equation)

        editor?.edit(editBuilder => {
          editBuilder.insert(selectionStart, '<!-- ')
          editBuilder.insert(selectionEnd, ` --> ${renderedImage}`)
        })
        vscode.window.showInformationMessage(`📐 Rendered equation: ${selection}!`)
      } else {
        vscode.window.showErrorMessage('❗ Not a valid equation, include leading and trailing dollar signs: $ as well.')
      }
    }
  })

  context.subscriptions.push(disposable)
}

export function deactivate() {}
