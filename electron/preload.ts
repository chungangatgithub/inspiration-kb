import { contextBridge, clipboard } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text: string) => clipboard.writeText(text),
});
