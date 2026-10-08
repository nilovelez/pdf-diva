import { Menu } from 'electron';
import { t } from './settings';
import { isMac } from './windows';

/**
 * macOS needs an application menu for Cmd+Q, Cmd+H and copy and paste (the password field). On
 * Windows and Linux the app has no menu bar at all.
 */
export function setAppMenu(): void {
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }
  const menu = Menu.buildFromTemplate([
    {
      role: 'appMenu',
      submenu: [
        { role: 'hide', label: t('menu.hide') },
        { role: 'hideOthers', label: t('menu.hideOthers') },
        { role: 'unhide', label: t('menu.showAll') },
        { type: 'separator' },
        { role: 'quit', label: t('menu.quit') },
      ],
    },
    {
      label: t('menu.edit'),
      submenu: [
        { role: 'undo', label: t('menu.undo') },
        { role: 'redo', label: t('menu.redo') },
        { type: 'separator' },
        { role: 'cut', label: t('menu.cut') },
        { role: 'copy', label: t('menu.copy') },
        { role: 'paste', label: t('menu.paste') },
        { role: 'selectAll', label: t('menu.selectAll') },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
