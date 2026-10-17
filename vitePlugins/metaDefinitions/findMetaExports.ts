import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const unwrapExpression = (expression: ts.Expression): ts.Expression => {
  while (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
    || ts.isTypeAssertionExpression(expression) || ts.isSatisfiesExpression(expression)) {
    expression = expression.expression
  }
  return expression
}

export const findMetaExports = (file: string, source: string, sourceRoot: string): string[] => {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const factories = new Set<string>()
  const utilsPath = resolve(sourceRoot, 'meta/utils')

  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause

    if (!clause || clause.phaseModifier === ts.SyntaxKind.TypeKeyword
      || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue

    const specifier = statement.moduleSpecifier.text
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue

    const path = specifier.startsWith('@/')
      ? resolve(sourceRoot, specifier.slice(2))
      : resolve(dirname(file), specifier)
    if (path !== utilsPath && path !== `${utilsPath}.ts`) continue

    for (const item of clause.namedBindings.elements) {
      if (!item.isTypeOnly && (item.propertyName ?? item.name).text === 'defineMetaDefinition')
        factories.add(item.name.text)
    }
  }

  if (!factories.size) return []

  const findCall = (expression: ts.Expression) => {
    const value = unwrapExpression(expression)
    if (ts.isCallExpression(value) && ts.isIdentifier(value.expression) && factories.has(value.expression.text))
      return value
  }
  const definitions = new Map<string, ts.CallExpression>()

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
      const call = findCall(declaration.initializer)
      if (call) definitions.set(declaration.name.text, call)
    }
  }

  // One definition can be exported under several names; import its value only once.
  const exports = new Map<ts.CallExpression, string>()
  const addExport = (call: ts.CallExpression | undefined, name: string) => {
    if (call && !exports.has(call)) exports.set(call, name)
  }

  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement)
      && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name))
          addExport(definitions.get(declaration.name.text), declaration.name.text)
      }
    }

    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const value = unwrapExpression(statement.expression)
      addExport(ts.isIdentifier(value) ? definitions.get(value.text) : findCall(value), 'default')
    }

    if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && !statement.moduleSpecifier
      && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const item of statement.exportClause.elements) {
        if (!item.isTypeOnly)
          addExport(definitions.get((item.propertyName ?? item.name).text), item.name.text)
      }
    }
  }

  return [...exports.values()]
}
