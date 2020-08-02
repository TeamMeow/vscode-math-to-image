import * as vscode from 'vscode'
const mjAPI = require('mathjax-node')
const fs = require('fs')
const path = require('path')

const digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const digits_len = digits.length
// VS Code active editor for current session
let editor = vscode.window.activeTextEditor

enum RenderType {REMOTE, LOCAL}
enum MathType {INLINE, DISPLAY}

/**
 * Encode URL and return rendered <img> tag based on selected equation
 * @param equation selected inline or multiline equation
 */
function renderEquation(equation: string, mathType: MathType) {
  const renderAPIUrl = 'https://render.githubusercontent.com/render/math?math='
  const encodedMath = encodeURIComponent(equation)

  if (mathType == MathType.DISPLAY) return `\n\n<div align="center"><img src="${renderAPIUrl}${encodedMath}"></div>`
  else return `<img src="${renderAPIUrl}${encodedMath}">`
}

function getSVGPath(filename: string) {
  let p = vscode.workspace.getConfiguration().get('vscode-math-to-image.svgSavePath')
	let folderpath = ''
	let current = editor?.document.uri.fsPath
  // console.log(p)
  // console.log(current)
	if (p == '.') {
		folderpath = path.dirname(current)
	} else {
		folderpath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''
	}

	return path.join(folderpath, 'svg', filename)
}

function writeSVGFile(filepath: string, filecontent: string) {
  if (!fs.existsSync(path.dirname(filepath))) {
    fs.mkdir(path.dirname(filepath), {recursive: true}, (err: any) => {
      if (err) console.log('[err] system error: create svg folder failed')
      else {
        fs.writeFile(filepath, filecontent, (err: any) => {
          if (err) console.log('[err] system error: create svg file failed')
        })
      }
    })
  } else {
    fs.writeFile(filepath, filecontent, (err: any) => {
      if (err) console.log('[err] system error: create svg file failed2')
    })
  }
}

function renderEquationLocal(equation: string, mathType: MathType) {
  const mathToSVG = function(equation: string, format: string) {
    return new Promise((resolve, reject) => mjAPI.typeset({
      math: equation,
      format: format, // or "inline-TeX", "MathML"
      svg: true,      // or svg:true, or html:true
    }, function (data: any) {
      if (data.errors) reject(data.errors)
      else resolve(data.svg.replace(/\n/g, ''))
    }))
  }
  
  let fname = (function (n: number): string {
    let a = []
    for (let i = 0; i < n ; i++) a.push(digits[Math.floor(Math.random() * digits_len)])
    return a.join('')
  })(10)+ '.svg'
  let svgpath = getSVGPath(fname)
  let rp = path.relative(path.dirname(editor?.document.uri.fsPath), svgpath)

  mathToSVG(equation, mathType == MathType.DISPLAY ? 'TeX' : 'inline-TeX').then((res:any) => {
    writeSVGFile(svgpath, res)
  }).catch((err: any) => {
    vscode.window.showErrorMessage('[err]: ' + err)
  })

  if (mathType = MathType.INLINE) return `<img style="transform: translateY(0.25em);" src="${rp}"/>`
	else return `\n<div align=center><img src="${rp}"/></div>`
}

function insertMathImage(renderedImage: string, start: vscode.Position, end: vscode.Position) {
  // console.log(renderedImage, start, end)
  editor?.edit(editBuilder => {
    editBuilder.insert(start, '<!-- ')
    editBuilder.insert(end, ` --> ${renderedImage}`)
  })
  vscode.window.showInformationMessage(`📐 Render equation successfully!`)
}

function renderEntry(renderType: RenderType) {
  editor = vscode.window.activeTextEditor
  const selection = editor?.document.getText(editor.selection)
  const selectionStart = editor?.selection.start
  const selectionEnd = editor?.selection.end
  
  const inlineMath = /^\$[\s\S]*[\S]+[\s\S]*\$$/
  const displayMath = /^\$\$[\s\S]*[\S]+[\s\S]*\$\$$/

  if (selection === undefined || selectionStart === undefined || selectionEnd === undefined) {
    vscode.window.showErrorMessage('❗ Nothing selected!')
  } else {
    // console.log(selection)
    if (displayMath.test(selection)) {
      // Remove leading $$ and trailing $$
      const equation = selection.split('\n').slice(1, -1).join('\n')

      let renderedImage = renderType == RenderType.REMOTE ? renderEquation(equation, MathType.DISPLAY) : renderEquationLocal(equation, MathType.DISPLAY)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else if (inlineMath.test(selection)) {
      // Remove leading $ and trailing $
      const equation = selection.slice(1, -1).trim()

      let renderedImage = renderType == RenderType.REMOTE ? renderEquation(equation, MathType.INLINE) : renderEquationLocal(equation, MathType.INLINE)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else {
      vscode.window.showErrorMessage('❗ Not a valid equation, include leading and trailing dollar signs: $ as well.')
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  // console.log('Congratulations, your extension "vscode-math-to-image" is now active!')

  // let disposable = vscode.commands.registerCommand('vscode-math-to-image.render-selection', () => {
  //   // Get selection text
  //   const selection = editor?.document.getText(editor.selection)
  //   const selectionStart = editor?.selection.start
  //   const selectionEnd = editor?.selection.end

  //   // const inline = selectionStart?.line === selectionEnd?.line ? true : false
  //   // console.log(selection, inline)

  //   if (selection === undefined || selectionStart === undefined || selectionEnd === undefined) {
  //     vscode.window.showErrorMessage('❗ Nothing selected!')
  //   } else {
  //     const inlineMath = /^\$[\s\S]*[\S]+[\s\S]*\$$/
  //     const displayMath = /^\$\$[\s\S]*[\S]+[\s\S]*\$\$$/

  //     // Enter rendered <img> into editor (and commenting out original equation)
  //     if (displayMath.test(selection)) {
  //       // Remove leading $$ and trailing $$
  //       const equation = selection.split('\n').slice(1, -1).join('\n')
  //       const renderedImage = renderEquation(equation)

  //       editor?.edit(editBuilder => {
  //         editBuilder.insert(selectionStart, '<!-- ')
  //         editBuilder.insert(selectionEnd, ` -->\n\n<div align="center">${renderedImage}</div>`)
  //       })
  //       vscode.window.showInformationMessage(`📐 Rendered equation: ${selection}!`)
  //     } else if (inlineMath.test(selection)) {
  //       // Remove leading $ and trailing $
  //       const equation = selection.slice(1, -1).trim()
  //       const renderedImage = renderEquation(equation)

  //       editor?.edit(editBuilder => {
  //         editBuilder.insert(selectionStart, '<!-- ')
  //         editBuilder.insert(selectionEnd, ` --> ${renderedImage}`)
  //       })
  //       vscode.window.showInformationMessage(`📐 Rendered equation: ${selection}!`)
  //     } else {
  //       vscode.window.showErrorMessage('❗ Not a valid equation, include leading and trailing dollar signs: $ as well.')
  //     }
  //   }
  // })
  let disposable = vscode.commands.registerCommand('vscode-math-to-image.render-selection', () => {
    renderEntry(RenderType.REMOTE)
  })

  let disposable2 = vscode.commands.registerCommand('vscode-math-to-image.render-selection-local', () => {
    renderEntry(RenderType.LOCAL)
  })

  context.subscriptions.push(disposable)
  context.subscriptions.push(disposable2)
}

export function deactivate() {}
