import PushPlugin from './PushPlugin';
import {offlinePushConfig} from '../config';

export function configureOfflinePush(nim: any): void {
  const settingService = nim?.V2NIMSettingService;
  if (!settingService?.setOfflinePushConfig) {
    throw new Error(
      'A V2NIM instance is required before configuring offline push.',
    );
  }

  console.log('[NIM][offlinePush] setOfflinePushConfig start');
  settingService.setOfflinePushConfig(PushPlugin, offlinePushConfig);
  console.log('[NIM][offlinePush] setOfflinePushConfig completed');
}
