import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

//! Can't find TypeScript types definition for mathjax-node
const mjAPI = require('mathjax-node')

const digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const digits_len = digits.length

// VS Code active editor for current session
let editor = vscode.window.activeTextEditor

enum RenderType {
  REMOTE,
  LOCAL,
}
enum MathType {
  INLINE,
  DISPLAY,
}

/**
 * Get absolute SVG file path to write
 *
 * @param fileName name of SVG file
 */
function getSVGPath(fileName: string) {
  let p = vscode.workspace.getConfiguration().get('vscode-math-to-image.svgSavePath')
  let folderPath = ''
  let current: any = editor?.document.uri.fsPath

  if (p == '.') {
    folderPath = path.dirname(current)
  } else {
    folderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''
  }

  return path.join(folderPath, 'svg', fileName)
}

/**
 * Write rendered SVG content to local SVG file
 *
 * @param filePath path to write generated SVG file
 * @param fileContent SVG content to write to file
 */
function writeSVGFile(filePath: string, fileContent: string) {
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdir(path.dirname(filePath), { recursive: true }, (err: any) => {
      if (err) console.log('[err] system error: create svg folder failed')
      else {
        fs.writeFile(filePath, fileContent, (err: any) => {
          if (err) console.log('[err] system error: create svg file failed')
        })
      }
    })
  } else {
    fs.writeFile(filePath, fileContent, (err: any) => {
      if (err) console.log('[err] system error: create svg file failed2')
    })
  }
}

/**
 * Encode URL and return rendered <img> tag based on selected equation
 *
 * @param equation selected inline or multiline equation
 */
function renderEquationRemote(equation: string, mathType: MathType) {
  const renderAPIUrl = 'https://render.githubusercontent.com/render/math?math='
  const encodedMath = encodeURIComponent(equation)

  if (mathType == MathType.DISPLAY) {
    return `\n\n<div align="center"><img src="${renderAPIUrl}${encodedMath}"></div>`
  } else {
    return `<img src="${renderAPIUrl}${encodedMath}">`
  }
}

/**
 * Render equation with MathJax to SVG and source from local file
 *
 * @param equation selected inline or multiline equation
 * @param mathType equation type (inline / multiline)
 */
function renderEquationLocal(equation: string, mathType: MathType) {
  const mathToSVG = function (equation: string, format: string) {
    return new Promise((resolve, reject) =>
      mjAPI.typeset(
        {
          math: equation,
          format: format, // or "inline-TeX", "MathML"
          svg: true, // or svg:true, or html:true
        },
        function (data: any) {
          if (data.errors) reject(data.errors)
          else resolve(data.svg.replace(/\n/g, ''))
        }
      )
    )
  }

  let fname =
    (function (n: number): string {
      let a = []
      for (let i = 0; i < n; i++) a.push(digits[Math.floor(Math.random() * digits_len)])
      return a.join('')
    })(10) + '.svg'
  let svgPath = getSVGPath(fname)
  let docPath: any = editor?.document.uri.fsPath
  let rp = path.relative(path.dirname(docPath), svgPath)

  mathToSVG(equation, mathType == MathType.DISPLAY ? 'TeX' : 'inline-TeX')
    .then((res: any) => {
      writeSVGFile(svgPath, res)
    })
    .catch((err: any) => {
      vscode.window.showErrorMessage('[err]: ' + err)
    })

  if (mathType == MathType.INLINE) {
    return `<img style="transform: translateY(0.25em);" src="${rp}"/>`
  } else {
    return `\n\n<div align="center"><img src="${rp}"/></div>`
  }
}

/**
 * Insert rendered image string into current VS Code editor
 *
 * @param renderedImage rendered image string (remote or local image)
 * @param start selection start
 * @param end selection end
 */
function insertMathImage(renderedImage: string, start: vscode.Position, end: vscode.Position) {
  // console.log(renderedImage, start, end)
  editor?.edit(editBuilder => {
    editBuilder.insert(start, '<!-- ')
    editBuilder.insert(end, ` --> ${renderedImage}`)
  })
  vscode.window.showInformationMessage(`📐 Render equation successfully!`)
}

/**
 * Render function to insert image form of the selected equation into current editor
 *
 * @param renderType type of equation to render (inline or multiline)
 */
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

      let renderedImage =
        renderType == RenderType.REMOTE
          ? renderEquationRemote(equation, MathType.DISPLAY)
          : renderEquationLocal(equation, MathType.DISPLAY)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else if (inlineMath.test(selection)) {
      // Remove leading $ and trailing $
      const equation = selection.slice(1, -1).trim()

      let renderedImage =
        renderType == RenderType.REMOTE
          ? renderEquationRemote(equation, MathType.INLINE)
          : renderEquationLocal(equation, MathType.INLINE)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else {
      vscode.window.showErrorMessage('❗ Not a valid equation, include leading and trailing dollar signs: $ as well.')
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  let renderSelection = vscode.commands.registerCommand('vscode-math-to-image.render-selection', () => {
    renderEntry(RenderType.REMOTE)
  })

  let renderSelectionLocal = vscode.commands.registerCommand('vscode-math-to-image.render-selection-local', () => {
    renderEntry(RenderType.LOCAL)
  })

  context.subscriptions.push(renderSelection)
  context.subscriptions.push(renderSelectionLocal)
}

export function deactivate() {}
