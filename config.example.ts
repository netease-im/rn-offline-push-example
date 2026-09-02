// Copy this file to config.ts and replace the placeholders with customer values.
export const DEFAULT_ACCOUNT = '';
export const DEFAULT_CONVERSATION_TARGET_ACCOUNT = '';
export const DEFAULT_APPKEY = '';
export const STATIC_TOKEN: string = '*********';

// Must match android/app/build.gradle applicationId and the native package name.
export const RN_PACKAGE_NAME = 'com.example.rnofflinepush';

export const offlinePushConfig = {
  miPush: {
    appId: 'YOUR_MI_PUSH_APP_ID',
    appKey: 'YOUR_MI_PUSH_APP_KEY',
    certificateName: 'YOUR_MI_PUSH_CERTIFICATE_NAME',
  },
  vivoPush: {
    certificateName: 'YOUR_VIVO_PUSH_CERTIFICATE_NAME',
  },
  oppoPush: {
    appId: 'YOUR_OPPO_PUSH_APP_ID',
    appKey: 'YOUR_OPPO_PUSH_APP_KEY',
    secret: 'YOUR_OPPO_PUSH_SECRET',
    certificateName: 'YOUR_OPPO_PUSH_CERTIFICATE_NAME',
  },
  hwPush: {
    appId: 'YOUR_HUAWEI_PUSH_APP_ID',
    certificateName: 'YOUR_HUAWEI_PUSH_CERTIFICATE_NAME',
  },
  fcmPush: {
    certificateName: 'YOUR_FCM_CERTIFICATE_NAME',
  },
  mzPush: {
    appId: 'YOUR_MEIZU_PUSH_APP_ID',
    appKey: 'YOUR_MEIZU_PUSH_APP_KEY',
    certificateName: 'YOUR_MEIZU_PUSH_CERTIFICATE_NAME',
  },
  honorPush: {
    certificateName: 'YOUR_HONOR_PUSH_CERTIFICATE_NAME',
  },
  apns: {
    certificateName: 'YOUR_APNS_CERTIFICATE_NAME',
  },
};
