import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('rentomojo', {
  platform: process.platform,
  versions: process.versions,
});
