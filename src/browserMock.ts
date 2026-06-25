/**
 * Mock de window.api para quando a app corre no browser (fora do Electron).
 * No Electron, o preload.ts substitui isto com as APIs reais.
 */

if (typeof window !== 'undefined' && !window.api) {
  const noopBool = () => Promise.resolve(false)
  const noopVoid = () => {}

  window.api = {
    minimize: noopVoid,
    maximize: noopVoid,
    close: noopVoid,
    openFolder: () => Promise.resolve(null),
    readDir: () => Promise.resolve({ name: 'root', path: '/', type: 'directory' as const, children: [] }),
    readFile: () => Promise.resolve(''),
    writeFile: noopBool,
    createFile: noopBool,
    createFolder: noopBool,
    rename: noopBool,
    move: noopBool,
    copy: noopBool,
    delete: noopBool,
    getLocalIP: () => Promise.resolve('127.0.0.1'),
    startServer: noopBool,
    stopServer: noopBool,
    onFileChange: noopVoid,
    onPeerConnected: noopVoid,
    onPeerDisconnected: noopVoid,
    spawnTerminal: () => Promise.resolve(),
    terminalInput: noopVoid,
    terminalResize: () => Promise.resolve(),
    onTerminalOutput: noopVoid,
    killTerminal: noopVoid,
    openInVSCode: noopVoid,
    searchInFiles: () => Promise.resolve([]),
    gitStatus: () => Promise.resolve([]),
    gitCommit: () => Promise.resolve(),
    gitLog: () => Promise.resolve([]),
    gitDiff: () => Promise.resolve({ added: [], modified: [], removed: [] }),
    gitPush: () => Promise.resolve({ ok: false, msg: 'Not available in browser' }),
    gitPull: () => Promise.resolve({ ok: false, msg: 'Not available in browser' }),
    copyExternal: noopBool,
    openFileAtLine: noopVoid,
    onOpenFileAtLine: noopVoid,
  }
}
