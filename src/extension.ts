import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

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
 * @param fileName Name of SVG file
 */
function getSVGPath(fileName: string) {
  const svgSavePathConf = vscode.workspace.getConfiguration().get('vscode-math-to-image.svgSavePath')
  const currentPath: string = editor?.document.uri.fsPath!
  let folderPath = ''

  if (svgSavePathConf === 'Current file directory') {
    folderPath = path.dirname(currentPath)
  } else {
    folderPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : ''
  }

  return path.join(folderPath, 'svg', fileName)
}

/**
 * Write rendered SVG content to local SVG file
 *
 * @param filePath Path to write generated SVG file
 * @param fileContent SVG content to write to file
 */
function writeSVGFile(filePath: string, fileContent: string) {
  const dirPath = path.dirname(filePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdir(dirPath, { recursive: true }, (err: any) => {
      if (err) {
        vscode.window.showErrorMessage(`Failed to create SVG folder at ${dirPath}.`)
        return
      }
    })
  }
  fs.writeFile(filePath, fileContent, (err: any) => {
    if (err) {
      vscode.window.showErrorMessage(`Failed to create SVG file at ${filePath}.`)
    }
  })
}

/**
 * Generate a random filename
 *
 * @param len Length of the generated filename
 * @param ext Intended file extension
 */
function randomFilename(len: number, ext: string) {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Create an array with length len and fill with random digits
  const sequence = [...Array(len)].map(_ => {
    return digits[Math.floor(Math.random() * digits.length)]
  })
  return `${sequence.join('')}.${ext}`
}

/**
 * Encode URL and return rendered <img> tag based on selected equation
 *
 * @param equation Selected inline or display equation
 * @param mathType Equation type (inline / display)
 */
function renderEquationRemote(equation: string, mathType: MathType) {
  const renderAPIUrl = 'https://render.githubusercontent.com/render/math?math='
  const encodedMath = encodeURIComponent(equation)

  if (mathType === MathType.DISPLAY) {
    return `\n\n<div align="center"><img src="${renderAPIUrl}${encodedMath}"></div>`
  } else {
    return `<img src="${renderAPIUrl}${encodedMath}">`
  }
}

/**
 * Render equation with MathJax to SVG and source from local file
 *
 * @param equation Selected inline or display equation
 * @param mathType Equation type (inline / display)
 */
function renderEquationLocal(equation: string, mathType: MathType) {
  const filename = randomFilename(10, 'svg')
  const svgPath = getSVGPath(filename)
  const documentPath: string = editor?.document.uri.fsPath!
  const relativePath = path.relative(path.dirname(documentPath), svgPath)

  require('mathjax')
    .init({
      loader: { load: ['input/tex', 'output/svg'] },
    })
    .then((MathJax: any) => {
      const renderedNode = MathJax.tex2svg(equation, {
        display: mathType === MathType.DISPLAY,
      })
      const renderedSvg = MathJax.startup.adaptor.innerHTML(renderedNode)
      writeSVGFile(svgPath, renderedSvg)
    })
    .catch((err: string) => {
      vscode.window.showErrorMessage(`[err]: ${err}`)
    })

  if (mathType === MathType.INLINE) {
    return `<img style="transform: translateY(0.1em);" src="${relativePath}"/>`
  } else {
    return `\n\n<div align="center"><img src="${relativePath}"/></div>`
  }
}

/**
 * Insert rendered image string into current VS Code editor
 *
 * @param renderedImage Rendered image string (remote or local image)
 * @param start Selection start
 * @param end Selection end
 */
function insertMathImage(renderedImage: string, start: vscode.Position, end: vscode.Position) {
  editor?.edit(editBuilder => {
    editBuilder.insert(start, '<!-- ')
    editBuilder.insert(end, ` --> ${renderedImage}`)
  })
  vscode.window.showInformationMessage(`Render equation successfully!`)
}

/**
 * Render function to insert image form of the selected equation into current editor
 *
 * @param renderType Type of equation to render (inline or multiline)
 */
function renderEntry(renderType: RenderType) {
  editor = vscode.window.activeTextEditor
  const selection = editor?.document.getText(editor.selection)
  const selectionStart = editor?.selection.start
  const selectionEnd = editor?.selection.end

  const inlineMath = /^\$[\s\S]*[\S]+[\s\S]*\$$/
  const displayMath = /^\$\$[\s\S]*[\S]+[\s\S]*\$\$$/

  if (selection === undefined || selectionStart === undefined || selectionEnd === undefined) {
    vscode.window.showErrorMessage('Nothing selected!')
  } else {
    if (displayMath.test(selection)) {
      // Remove leading $$ and trailing $$
      const equation = selection.split('\n').slice(1, -1).join('\n')

      let renderedImage =
        renderType === RenderType.REMOTE
          ? renderEquationRemote(equation, MathType.DISPLAY)
          : renderEquationLocal(equation, MathType.DISPLAY)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else if (inlineMath.test(selection)) {
      // Remove leading $ and trailing $
      const equation = selection.slice(1, -1).trim()

      let renderedImage =
        renderType === RenderType.REMOTE
          ? renderEquationRemote(equation, MathType.INLINE)
          : renderEquationLocal(equation, MathType.INLINE)
      insertMathImage(renderedImage, selectionStart, selectionEnd)
    } else {
      vscode.window.showErrorMessage('Not a valid equation, include leading and trailing dollar signs: $ as well.')
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
