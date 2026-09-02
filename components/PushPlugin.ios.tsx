type PushNotificationIOSModule = Record<string, any>;

const PushPlugin = new Proxy<PushNotificationIOSModule>(
  {} as PushNotificationIOSModule,
  {
    get(_target, property: string) {
      const module = require('@react-native-community/push-notification-ios')
        .default as PushNotificationIOSModule;
      const value = module[property];
      return typeof value === 'function' ? value.bind(module) : value;
    },
  },
);

export default PushPlugin;
