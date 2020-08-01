<h1>Example <code>vscode-math-to-image</code> rendering</h1>

- [Native markdown](#native-markdown)
  - [Display math](#display-math)
  - [Inline equation](#inline-equation)
- [GitHub LaTeX image](#github-latex-image)
  - [Display math](#display-math-1)
  - [Inline equation](#inline-equation-1)

## Native markdown

> This section won't be rendered inside GitHub. Markdown LaTeX equation rendering relies on third-party libraries (for instance: KaTeX).

### Display math

Equation:

$$\ell = \sum_{i}^{N}(y_i - \hat{y}_i)^2 - ||w||_2^2$$

Aligned environment:

$$
\begin{aligned}
  f &= 2 + x + 3 \\
    &= 5 + x
\end{aligned}
$$

### Inline equation

In physics, the mass-energy equivalence is stated by the equation $E=mc^2$, discovered in 1905 by Albert Einstein.

## GitHub LaTeX image

> Equations in this section **WILL** be rendered as they have been converted to images (by this extension!) which are rendered with GitHub's official Jupyter Notebook rendering engine. This hack is provided here: [A hack for showing LaTeX formulas in GitHub markdown](https://gist.github.com/a-rodin/fef3f543412d6e1ec5b6cf55bf197d7b).

### Display math

Equation:

<!-- $$
\ell = \sum_{i}^{N}(y_i - \hat{y}_i)^2 - ||w||_2^2
$$ -->

<div align="center"><img src="https://render.githubusercontent.com/render/math?math=%5Cell%20%3D%20%5Csum_%7Bi%7D%5E%7BN%7D(y_i%20-%20%5Chat%7By%7D_i)%5E2%20-%20%7C%7Cw%7C%7C_2%5E2%0D"></div>

Aligned environment:

<!-- $$
\begin{aligned}
  f &= 2 + x + 3 \\
    &= 5 + x
\end{aligned}
$$ -->

<div align="center"><img src="https://render.githubusercontent.com/render/math?math=%5Cbegin%7Baligned%7D%0D%0A%20%20f%20%26%3D%202%20%2B%20x%20%2B%203%20%5C%5C%0D%0A%20%20%20%20%26%3D%205%20%2B%20x%0D%0A%5Cend%7Baligned%7D%0D"></div>

### Inline equation

In physics, the mass-energy equivalence is stated by the equation <!-- $E=mc^2$ --> <img src="https://render.githubusercontent.com/render/math?math=E%3Dmc%5E2">, discovered in 1905 by Albert Einstein.